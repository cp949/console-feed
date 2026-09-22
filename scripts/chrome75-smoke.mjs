import { createServer } from 'node:http'
import { readFile } from 'node:fs/promises'
import { resolve, sep, extname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { setTimeout as delay } from 'node:timers/promises'
import {
  Worker,
  isMainThread,
  parentPort,
  workerData,
} from 'node:worker_threads'

export function assertResult(version, result, protocolErrors) {
  if (version !== '75.0.3770.90')
    throw new Error(`Chromium 75.0.3770.90 필요: ${version}`)
  if (protocolErrors.length)
    throw new Error(`페이지 오류: ${protocolErrors[0]}`)
  if (!result || !Array.isArray(result.errors))
    throw new Error('fixture 결과가 없습니다')
  if (result.errors.length) throw new Error(`페이지 오류: ${result.errors[0]}`)
  for (const key of [
    'done',
    'captured',
    'decoded',
    'rendered',
    'restored',
    'styled',
  ]) {
    if (result[key] !== true) throw new Error(`${key} 검증 실패`)
  }
}

// 내장 WebSocket은 강제 destroy API가 없다. 연결을 Worker에 소유시켜
// close handshake를 거부하는 peer도 다른 작업의 소켓에 손대지 않고 정리한다.
export function runSmoke(options) {
  return new Promise((resolveResult, rejectResult) => {
    const worker = new Worker(new URL(import.meta.url), {
      workerData: { kind: 'chrome75-cdp', options },
    })
    let outcome
    let closeDeadline
    worker.once('message', (message) => {
      outcome = message
      // runCdpSession의 finally가 close()를 요청한 뒤 정상 종료를 먼저 기다린다.
      closeDeadline = setTimeout(() => {
        void worker.terminate()
      }, 100)
    })
    worker.once('error', (error) => {
      outcome = { error: error.message }
    })
    worker.once('exit', (code) => {
      clearTimeout(closeDeadline)
      if (outcome?.error) rejectResult(new Error(outcome.error))
      else if (outcome?.result) resolveResult(outcome.result)
      else
        rejectResult(new Error(`CDP Worker가 결과 없이 종료했습니다: ${code}`))
    })
  })
}

// 최신 Node 문법은 호스트에서만 실행한다. Runtime.evaluate의 문자열은 Chrome 75 문법이다.
async function runCdpSession({ endpoint, pageUrl, timeoutMs = 30000 }) {
  let version = '확인 전'
  let socket
  let stopped = false
  let loaded = false
  let nextId = 0
  const pending = new Map()
  const protocolErrors = []
  const browserLogs = []
  const abort = new AbortController()
  let fail
  const failure = new Promise((_, reject) => {
    fail = reject
  })
  // 이벤트가 CDP 요청 사이에 도착하더라도 미처리 rejection을 만들지 않는다.
  failure.catch(() => {})
  const timer = setTimeout(() => {
    const error = new Error(`시간 초과 (${timeoutMs}ms)`)
    fail(error)
    abort.abort(error)
  }, timeoutMs)
  const guard = (operation) => Promise.race([operation, failure])
  const json = async (path) => {
    const response = await fetch(`${endpoint}${path}`, { signal: abort.signal })
    if (!response.ok) throw new Error(`CDP HTTP ${response.status}: ${path}`)
    return response.json()
  }
  const send = (method, params = {}) =>
    guard(
      new Promise((resolveReply, rejectReply) => {
        const id = ++nextId
        pending.set(id, { resolve: resolveReply, reject: rejectReply })
        socket.send(JSON.stringify({ id, method, params }))
      }),
    )

  try {
    // 컨테이너 시작 직후의 연결 거부만 재시도하며 전체 제한 시간은 유지한다.
    let metadata
    while (!metadata) {
      try {
        metadata = await guard(json('/json/version'))
      } catch (error) {
        if (abort.signal.aborted) throw error
        await guard(delay(100))
      }
    }
    version = metadata.Browser.split('/').at(-1)
    console.log(`브라우저: ${metadata.Browser}`)
    if (version !== '75.0.3770.90')
      throw new Error(`Chromium 75.0.3770.90 필요: ${version}`)
    const pages = await guard(json('/json'))
    const page = pages.find((target) => target.type === 'page')
    if (!page?.webSocketDebuggerUrl)
      throw new Error('CDP page endpoint가 없습니다')
    socket = new WebSocket(page.webSocketDebuggerUrl)
    socket.addEventListener('close', () => {
      if (!stopped) fail(new Error('CDP 연결 끊김'))
    })
    socket.addEventListener('error', () =>
      fail(new Error('CDP WebSocket 오류')),
    )
    socket.addEventListener('message', ({ data }) => {
      try {
        const message = JSON.parse(data)
        if (message.id) {
          const request = pending.get(message.id)
          pending.delete(message.id)
          if (message.error)
            request?.reject(
              new Error(`CDP protocol 오류: ${JSON.stringify(message.error)}`),
            )
          else request?.resolve(message.result)
          return
        }
        const { method, params } = message
        if (method === 'Page.loadEventFired') loaded = true
        if (method === 'Runtime.exceptionThrown') {
          const details = params.exceptionDetails
          protocolErrors.push(
            `${method}: ${details.exception?.description || details.text}`,
          )
        }
        if (method === 'Log.entryAdded') {
          const entry = params.entry
          browserLogs.push(entry)
          if (entry.level === 'error')
            protocolErrors.push(`${method}: ${entry.text}`)
        }
        if (method === 'Network.loadingFailed') {
          protocolErrors.push(
            `${method}: ${params.errorText} (${params.type}, ${params.requestId})`,
          )
        }
        if (protocolErrors.length) fail(new Error(protocolErrors[0]))
      } catch (error) {
        fail(error)
      }
    })
    await guard(
      new Promise((resolveOpen) =>
        socket.addEventListener('open', resolveOpen, { once: true }),
      ),
    )
    for (const method of [
      'Page.enable',
      'Runtime.enable',
      'Log.enable',
      'Network.enable',
    ])
      await send(method)
    loaded = false
    const navigation = await send('Page.navigate', { url: pageUrl })
    if (navigation.errorText)
      throw new Error(`탐색 실패: ${navigation.errorText}`)
    while (!loaded) await guard(delay(50))
    let result
    while (!result?.done) {
      const evaluation = await send('Runtime.evaluate', {
        expression:
          'window.__consoleFeedChrome75 && window.__consoleFeedChrome75.done ? window.__consoleFeedChrome75 : null',
        returnByValue: true,
      })
      if (evaluation.exceptionDetails)
        throw new Error(`평가 실패: ${evaluation.exceptionDetails.text}`)
      result = evaluation.result.value
      if (!result?.done) await guard(delay(50))
    }
    assertResult(version, result, protocolErrors)
    console.log(
      JSON.stringify({ version, result, protocolErrors, browserLogs }, null, 2),
    )
    return result
  } catch (error) {
    throw new Error(`Chromium ${version}: ${error.message}`, { cause: error })
  } finally {
    stopped = true
    clearTimeout(timer)
    abort.abort()
    socket?.close()
    for (const request of pending.values())
      request.reject(new Error('CDP 종료'))
    pending.clear()
  }
}

async function main() {
  const fixtureRoot = resolve(
    fileURLToPath(
      new URL('../fixtures/chrome75-consumer/dist', import.meta.url),
    ),
  )
  const server = createServer(async (request, response) => {
    try {
      const pathname = new URL(request.url, 'http://localhost').pathname
      if (pathname === '/favicon.ico') {
        response.writeHead(204).end()
        return
      }
      const file = resolve(
        fixtureRoot,
        `.${decodeURIComponent(pathname === '/' ? '/index.html' : pathname)}`,
      )
      if (!file.startsWith(`${fixtureRoot}${sep}`)) {
        response.writeHead(403).end()
        return
      }
      const content = await readFile(file)
      const mime =
        { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css' }[
          extname(file)
        ] || 'application/octet-stream'
      response
        .writeHead(200, { 'Content-Type': mime, 'Cache-Control': 'no-store' })
        .end(content)
    } catch {
      response.writeHead(404).end()
    }
  })
  try {
    await new Promise((resolveListen, rejectListen) => {
      server.once('error', rejectListen)
      server.listen(0, '127.0.0.1', resolveListen)
    })
    await runSmoke({
      endpoint: process.env.CDP_ENDPOINT || 'http://127.0.0.1:9222',
      pageUrl: `http://127.0.0.1:${server.address().port}/`,
      timeoutMs: Number(process.env.CHROME75_TIMEOUT_MS || 30000),
    })
  } finally {
    server.closeAllConnections()
    await new Promise((resolveClose) => server.close(resolveClose))
  }
}

if (!isMainThread && workerData?.kind === 'chrome75-cdp') {
  runCdpSession(workerData.options)
    .then(
      (result) => parentPort.postMessage({ result }),
      (error) => parentPort.postMessage({ error: error.message }),
    )
    .finally(() => parentPort.close())
} else if (
  isMainThread &&
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  main().catch((error) => {
    console.error(`Chrome 75 검증 실패: ${error.message}`)
    process.exitCode = 1
  })
}

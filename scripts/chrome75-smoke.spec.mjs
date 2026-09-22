import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createServer } from 'node:http'
import { createHash } from 'node:crypto'
import { spawn } from 'node:child_process'
import { assertResult, runSmoke } from './chrome75-smoke.mjs'

const passing = {
  done: true,
  captured: true,
  decoded: true,
  rendered: true,
  restored: true,
  styled: true,
  errors: [],
}

test('정확한 Chromium 75에서 모든 검증이 성공하면 통과한다', () => {
  assert.doesNotThrow(() => assertResult('75.0.3770.90', passing, []))
})

test('Chromium 83 결과로 Chromium 75 검증을 대체하지 못한다', () => {
  assert.throws(() => assertResult('83.0.4103.116', passing, []), /75/)
})

test('다른 Chromium 75 패치 버전도 거부한다', () => {
  assert.throws(
    () => assertResult('75.0.3770.100', passing, []),
    /75\.0\.3770\.90/,
  )
})

for (const key of [
  'done',
  'captured',
  'decoded',
  'rendered',
  'restored',
  'styled',
]) {
  test(`${key} 실패를 성공으로 처리하지 않는다`, () => {
    assert.throws(
      () => assertResult('75.0.3770.90', { ...passing, [key]: false }, []),
      new RegExp(key),
    )
  })
}

test('fixture가 보고한 첫 페이지 오류를 전달한다', () => {
  assert.throws(
    () =>
      assertResult(
        '75.0.3770.90',
        { ...passing, errors: ['fixture failed'] },
        [],
      ),
    /fixture failed/,
  )
})

test('CDP가 보고한 첫 페이지 오류를 전달한다', () => {
  assert.throws(
    () =>
      assertResult('75.0.3770.90', passing, [
        'Runtime.exceptionThrown: broken',
      ]),
    /Runtime.exceptionThrown: broken/,
  )
})

test('fixture 결과가 없으면 실패한다', () => {
  assert.throws(() => assertResult('75.0.3770.90', undefined, []))
})

// 외부 브라우저 대신 실제 HTTP/WebSocket 경계에 CDP 실패를 주입한다.
// 클라이언트 첫 요청 뒤 서버 이벤트를 보내므로 runner의 이벤트 처리와 종료를 검증한다.
async function cdpFailureEndpoint(t, failure) {
  const sockets = new Set()
  const server = createServer((request, response) => {
    const body =
      request.url === '/json/version'
        ? { Browser: 'HeadlessChrome/75.0.3770.90' }
        : [
            {
              type: 'page',
              webSocketDebuggerUrl: `ws://127.0.0.1:${server.address().port}/page`,
            },
          ]
    response
      .writeHead(200, { 'Content-Type': 'application/json' })
      .end(JSON.stringify(body))
  })
  server.on('upgrade', (request, socket) => {
    sockets.add(socket)
    const accept = createHash('sha1')
      .update(
        `${request.headers['sec-websocket-key']}258EAFA5-E914-47DA-95CA-C5AB0DC85B11`,
      )
      .digest('base64')
    socket.write(
      `HTTP/1.1 101 Switching Protocols\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Accept: ${accept}\r\n\r\n`,
    )
    socket.once('data', () => {
      if (failure === 'timeout') return
      if (failure === 'disconnect') {
        socket.end(Buffer.from([0x88, 0]))
        return
      }
      const payload = Buffer.from(JSON.stringify(failure))
      const header =
        payload.length < 126
          ? Buffer.from([0x81, payload.length])
          : Buffer.from([0x81, 126, payload.length >> 8, payload.length & 255])
      socket.write(Buffer.concat([header, payload]))
    })
  })
  await new Promise((resolveListen) =>
    server.listen(0, '127.0.0.1', resolveListen),
  )
  t.after(async () => {
    for (const socket of sockets) socket.destroy()
    server.closeAllConnections()
    await new Promise((resolveClose) => server.close(resolveClose))
  })
  return `http://127.0.0.1:${server.address().port}`
}

for (const [name, failure, expected] of [
  [
    '페이지 예외',
    {
      method: 'Runtime.exceptionThrown',
      params: {
        exceptionDetails: {
          text: 'Uncaught',
          exception: { description: 'ReferenceError: broken' },
        },
      },
    },
    /ReferenceError: broken/,
  ],
  [
    'Log 오류',
    {
      method: 'Log.entryAdded',
      params: { entry: { level: 'error', text: 'resource broken' } },
    },
    /Log.entryAdded: resource broken/,
  ],
  [
    '네트워크 실패',
    {
      method: 'Network.loadingFailed',
      params: { errorText: 'net::ERR_FAILED', type: 'Script', requestId: '1' },
    },
    /Network.loadingFailed: net::ERR_FAILED/,
  ],
  [
    '프로토콜 오류',
    { id: 1, error: { code: -32601, message: 'Method unavailable' } },
    /CDP protocol 오류.*Method unavailable/,
  ],
  ['CDP 연결 끊김', 'disconnect', /CDP 연결 끊김/],
  ['시간 초과', 'timeout', /시간 초과/],
]) {
  test(`${name}를 버전과 함께 실패로 보고한다`, async (t) => {
    const endpoint = await cdpFailureEndpoint(t, failure)
    await assert.rejects(
      runSmoke({
        endpoint,
        pageUrl: 'http://127.0.0.1/fixture',
        timeoutMs: failure === 'timeout' ? 250 : 3000,
      }),
      (error) => {
        assert.match(error.message, /75\.0\.3770\.90/)
        assert.match(error.message, expected)
        return true
      },
    )
  })
}

test('응답하지 않는 CDP peer를 유지해도 CLI는 제한 시간 안에 실패 종료한다', async (t) => {
  const endpoint = await cdpFailureEndpoint(t, 'timeout')
  const child = spawn(process.execPath, ['scripts/chrome75-smoke.mjs'], {
    env: { ...process.env, CDP_ENDPOINT: endpoint, CHROME75_TIMEOUT_MS: '150' },
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  let output = ''
  child.stdout.on('data', (chunk) => {
    output += chunk
  })
  child.stderr.on('data', (chunk) => {
    output += chunk
  })
  const exited = new Promise((resolveExit, rejectExit) => {
    child.once('error', rejectExit)
    child.once('exit', (code, signal) => resolveExit({ code, signal }))
  })
  let deadline
  try {
    const outcome = await Promise.race([
      exited,
      new Promise((resolveDeadline) => {
        deadline = setTimeout(() => resolveDeadline(null), 1500)
      }),
    ])
    // 이 assertion까지 server socket은 그대로 살아 있다. 부모의 종료로 성공을 만들지 않는다.
    assert.ok(outcome, `CLI가 1500ms 안에 종료하지 않았습니다: ${output}`)
    assert.equal(outcome.signal, null)
    assert.equal(outcome.code, 1)
    assert.match(output, /75\.0\.3770\.90.*시간 초과 \(150ms\)/)
  } finally {
    clearTimeout(deadline)
    if (child.exitCode === null && child.signalCode === null)
      child.kill('SIGKILL')
    await exited
  }
})

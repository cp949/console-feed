import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { pathToFileURL } from 'node:url'
import { runInNewContext } from 'node:vm'

// 실제 React와 빌드한 패키지를 사용하고, render 제출 시점만 지연시킨다.
const require = createRequire(
  new URL('../../../packages/console-feed/package.json', import.meta.url),
)
const { JSDOM } = createRequire(require.resolve('vitest/package.json'))('jsdom')
const dom = new JSDOM('<div id="root"></div>', { url: 'http://localhost/' })
Object.assign(globalThis, {
  window: dom.window,
  document: dom.window.document,
  HTMLElement: dom.window.HTMLElement,
  IS_REACT_ACT_ENVIRONMENT: true,
})

const React = require('react')
const { createRoot } = require('react-dom/client')
const frames = []
let pendingRender
let root
const scenario = process.argv[2]
const originalLog = dom.window.console.log
// TypeScript 7에는 transpileModule이 없어 vite가 쓰는 rolldown으로 CJS 변환한다.
const viteRequire = createRequire(require.resolve('vitest/package.json'))
const { rolldown } = await import(
  pathToFileURL(
    createRequire(viteRequire.resolve('vite/package.json')).resolve('rolldown'),
  ).href
)
const bundle = await rolldown({
  input: new URL('../src/main.tsx', import.meta.url).pathname,
  // 상대 경로 polyfills와 bare import는 아래 require 훅이 제공한다.
  external: (id) =>
    !id.startsWith('/') && (!id.startsWith('.') || id === './polyfills'),
  transform: { jsx: { runtime: 'automatic' }, target: 'es2019' },
  platform: 'node',
  logLevel: 'warn',
})
const {
  output: [{ code: compiled }],
} = await bundle.generate({ format: 'cjs' })
await bundle.close()

function flushFrames() {
  for (const callback of frames.splice(0)) callback(0)
}

try {
  runInNewContext(compiled, {
    exports: {},
    window: dom.window,
    document: dom.window.document,
    console: dom.window.console,
    Error,
    requestAnimationFrame(callback) {
      frames.push(callback)
      return frames.length
    },
    getComputedStyle(element) {
      if (scenario === 'style-error') throw new Error('계산 스타일 검사 실패')
      return dom.window.getComputedStyle(element)
    },
    require(name) {
      if (name === './polyfills') return {}
      if (name === 'react-dom/client') {
        return {
          createRoot(element) {
            root = createRoot(element)
            return {
              render(children) {
                pendingRender = () => root.render(children)
              },
            }
          },
        }
      }
      return require(name)
    },
  })

  // Hook은 실제 비동기 callback을 사용한다. 고정 시간 대신 제출을 기다린다.
  const deadline = Date.now() + 2000
  while (!pendingRender && Date.now() < deadline) {
    await new Promise((resolve) => setTimeout(resolve, 5))
  }
  assert.ok(pendingRender, 'Hook → Decode → root.render 제출')
  const result = dom.window.__consoleFeedChrome75
  assert.equal(result.captured, true)
  assert.equal(result.decoded, true)

  flushFrames()
  assert.equal(document.querySelector('[data-method="log"]'), null)
  assert.equal(
    result.done,
    false,
    'React commit 전 RAF는 완료를 확정하면 안 된다',
  )
  assert.notEqual(dom.window.console.log, originalLog)

  await React.act(async () => pendingRender())
  assert.ok(document.querySelector('[data-method="log"]'))
  flushFrames()

  assert.equal(result.done, true, 'React commit 후 검사를 완료해야 한다')
  assert.equal(result.restored, true)
  assert.equal(dom.window.console.log, originalLog)
  if (scenario === 'style-error') {
    assert.deepEqual(Array.from(result.errors), ['계산 스타일 검사 실패'])
  } else {
    assert.equal(result.rendered, true)
    assert.equal(result.styled, true)
    assert.deepEqual(Array.from(result.errors), [])
  }
} finally {
  if (root) await React.act(async () => root.unmount())
  dom.window.close()
}

import assert from 'node:assert/strict'
import { execFileSync, spawnSync } from 'node:child_process'
import {
  existsSync,
  mkdtempSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import test from 'node:test'

import {
  assertChrome75Bundle,
  assertNoOptionalChaining,
  createPackDirectory,
  replaceOutputDirectory,
  resolvePackedPackage,
  writeStandalonePnpmConfig,
} from './build-packed.mjs'

const fixtureRoot = new URL('..', import.meta.url)

test('폴리필은 React와 패키지보다 먼저 평가된다', () => {
  const main = readFileSync(new URL('../src/main.tsx', import.meta.url), 'utf8')

  assert.match(main, /^import '\.\/polyfills'/)
  assert.ok(
    main.indexOf("import './polyfills'") <
      main.indexOf("from 'react-dom/client'"),
  )
  assert.ok(
    main.indexOf("import './polyfills'") <
      main.indexOf("from '@cp949/console-feed'"),
  )
})

test('Vite 소비자 번들은 Chrome 75를 대상으로 한다', () => {
  const vite = readFileSync(
    new URL('../vite.config.ts', import.meta.url),
    'utf8',
  )

  assert.match(vite, /target:\s*'chrome75'/)
})

test('Hook payload은 재인코딩 없이 encoded 값에서 복원한다', () => {
  const main = readFileSync(new URL('../src/main.tsx', import.meta.url), 'utf8')

  assert.match(main, /const decoded = Decode\(encoded\)/)
  assert.doesNotMatch(main, /Encode\(parsed\)/)
})

test('초기화와 Hook 오류는 단일 완료 경로에서 복원한다', () => {
  const main = readFileSync(new URL('../src/main.tsx', import.meta.url), 'utf8')

  assert.match(main, /let hookedConsole/)
  assert.match(main, /function finish\(error\?/)
  assert.match(main, /root = createRoot\(rootElement\)/)
  assert.match(main, /Unhook\(hookedConsole\)/)
  assert.match(main, /result\.restored = console\.log === originalLog/)
  assert.match(main, /result\.done = true/)
})

for (const scenario of ['success', 'style-error']) {
  test(`React commit 전에는 완료하지 않고 commit 후 검사와 복원을 끝낸다: ${scenario}`, () => {
    execFileSync(
      process.execPath,
      [new URL('./fixture-runtime.mjs', import.meta.url).pathname, scenario],
      { stdio: 'pipe' },
    )
  })
}

test('fixture 산출물만 무시하고 소스와 권위 문서는 추적한다', () => {
  const paths = [
    'fixtures/chrome75-consumer/dist/index.html',
    'fixtures/chrome75-consumer/src/main.tsx',
    'README.md',
    'docs/audit/20260420/README.md',
  ]
  const ignored = spawnSync('git', ['check-ignore', '--no-index', ...paths], {
    cwd: new URL('../../..', import.meta.url),
    encoding: 'utf8',
  })

  assert.equal(
    ignored.status,
    0,
    'fixture dist가 ignore 규칙에 포함되어야 한다',
  )
  assert.equal(ignored.stdout.trim(), paths[0])
})

test('압축 패키지는 standalone node_modules에서 해석된다', () => {
  const installRoot = mkdtempSync(
    join(tmpdir(), 'console-feed-chrome75-fixture-'),
  )
  const packageRoot = join(
    installRoot,
    'node_modules',
    '@cp949',
    'console-feed',
  )

  try {
    mkdirSync(packageRoot, { recursive: true })
    writeFileSync(
      packageRoot + '/package.json',
      '{"name":"@cp949/console-feed"}',
    )

    const resolved = resolvePackedPackage(installRoot)
    assert.equal(resolved, resolve(packageRoot, 'package.json'))
    assert.ok(resolved.includes('/node_modules/@cp949/console-feed/'))
    assert.ok(
      !resolved.startsWith(resolve(fixtureRoot.pathname, '../../packages')),
    )
  } finally {
    rmSync(installRoot, { recursive: true, force: true })
  }
})

test('npm pack 대상 임시 디렉터리를 먼저 만든다', () => {
  const temporaryRoot = mkdtempSync(
    join(tmpdir(), 'console-feed-chrome75-fixture-'),
  )
  const packDirectory = join(temporaryRoot, 'pack')

  try {
    createPackDirectory(packDirectory)
    assert.ok(existsSync(packDirectory))
  } finally {
    rmSync(temporaryRoot, { recursive: true, force: true })
  }
})

test('임시 설치에서만 core-js build script를 허용한다', () => {
  const temporaryRoot = mkdtempSync(
    join(tmpdir(), 'console-feed-chrome75-fixture-'),
  )

  try {
    const configPath = writeStandalonePnpmConfig(temporaryRoot)
    const config = readFileSync(configPath, 'utf8')

    assert.equal(configPath, join(temporaryRoot, 'pnpm-workspace.yaml'))
    assert.match(config, /allowBuilds:\s+core-js: true/)
  } finally {
    rmSync(temporaryRoot, { recursive: true, force: true })
  }
})

test('optional chaining은 JS, MJS, CJS 산출물 모두에서 실패한다', () => {
  const outputDirectory = mkdtempSync(
    join(tmpdir(), 'console-feed-chrome75-output-'),
  )

  try {
    writeFileSync(join(outputDirectory, 'safe.mjs'), 'const value = 1')
    writeFileSync(join(outputDirectory, 'legacy.js'), 'target?.value')
    assert.throws(() => assertNoOptionalChaining(outputDirectory), /legacy\.js/)

    rmSync(join(outputDirectory, 'legacy.js'))
    writeFileSync(join(outputDirectory, 'legacy.mjs'), 'target?.value')
    assert.throws(
      () => assertNoOptionalChaining(outputDirectory),
      /legacy\.mjs/,
    )

    rmSync(join(outputDirectory, 'legacy.mjs'))
    writeFileSync(join(outputDirectory, 'legacy.cjs'), 'target?.value')
    assert.throws(
      () => assertNoOptionalChaining(outputDirectory),
      /legacy\.cjs/,
    )
  } finally {
    rmSync(outputDirectory, { recursive: true, force: true })
  }
})

test('Vite output은 실제 entry asset과 Chrome 75 문법을 함께 확인한다', () => {
  const outputDirectory = mkdtempSync(
    join(tmpdir(), 'console-feed-chrome75-output-'),
  )

  try {
    mkdirSync(join(outputDirectory, 'assets'))
    writeFileSync(
      join(outputDirectory, 'index.html'),
      '<script type="module" src="/assets/consumer.mjs"></script>',
    )
    writeFileSync(
      join(outputDirectory, 'assets', 'consumer.mjs'),
      'const ok = 1',
    )

    assert.deepEqual(assertChrome75Bundle(outputDirectory), [
      join(outputDirectory, 'assets', 'consumer.mjs'),
    ])
  } finally {
    rmSync(outputDirectory, { recursive: true, force: true })
  }
})

test('새 output 교체는 이전 hash 산출물을 남기지 않는다', () => {
  const root = mkdtempSync(join(tmpdir(), 'console-feed-chrome75-output-'))
  const outputDirectory = join(root, 'dist')
  const nextOutput = join(root, 'next')

  try {
    mkdirSync(join(outputDirectory, 'assets'), { recursive: true })
    writeFileSync(
      join(outputDirectory, 'assets', 'stale.js'),
      'const stale = 1',
    )
    mkdirSync(join(nextOutput, 'assets'), { recursive: true })
    writeFileSync(join(nextOutput, 'assets', 'current.js'), 'const current = 1')

    replaceOutputDirectory(nextOutput, outputDirectory)

    assert.ok(existsSync(join(outputDirectory, 'assets', 'current.js')))
    assert.ok(!existsSync(join(outputDirectory, 'assets', 'stale.js')))
    assert.ok(!existsSync(nextOutput))
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})

test('output 교체 실패 시 기존 output을 복원한다', () => {
  const root = mkdtempSync(join(tmpdir(), 'console-feed-chrome75-output-'))
  const outputDirectory = join(root, 'dist')
  const missingOutput = join(root, 'missing')

  try {
    mkdirSync(outputDirectory)
    writeFileSync(join(outputDirectory, 'previous.js'), 'const previous = 1')

    assert.throws(
      () => replaceOutputDirectory(missingOutput, outputDirectory),
      /ENOENT/,
    )
    assert.ok(existsSync(join(outputDirectory, 'previous.js')))
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})

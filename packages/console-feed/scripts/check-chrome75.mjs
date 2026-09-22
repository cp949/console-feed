import { existsSync, readdirSync, realpathSync } from 'node:fs'
import { join, relative, resolve } from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

import { ESLint } from 'eslint'
import esX from 'eslint-plugin-es-x'

const packageRoot = resolve(import.meta.dirname, '..')

const allowedChrome75Rules = {
  'es-x/no-bigint': 'off',
  'es-x/no-dynamic-import': 'off',
  'es-x/no-export-ns-from': 'off',
  'es-x/no-global-this': 'off',
  'es-x/no-import-meta': 'off',
  'es-x/no-numeric-separators': 'off',
  'es-x/no-string-prototype-matchall': 'off',
  'es-x/no-symbol-matchall': 'off',
}

const collisionPronePattern = /^es-x\/no-(?:iterator|set)-prototype-/

const collisionRuleOverrides = Object.fromEntries(
  Object.keys(esX.configs['flat/restrict-to-es2019'].rules ?? {})
    .filter((ruleId) => collisionPronePattern.test(ruleId))
    .map((ruleId) => [ruleId, 'off']),
)

const unsupportedChrome75WebApis = [
  {
    selector: "CallExpression[callee.name='structuredClone']",
    message: 'structuredClone은 Chrome 98부터 지원한다.',
  },
  {
    selector:
      "CallExpression[callee.object.name='globalThis'][callee.property.name='structuredClone']",
    message: 'globalThis.structuredClone은 Chrome 98부터 지원한다.',
  },
  {
    selector:
      "CallExpression[callee.object.name='crypto'][callee.property.name='randomUUID']",
    message: 'crypto.randomUUID는 Chrome 92부터 지원한다.',
  },
  {
    selector:
      "CallExpression[callee.object.object.name='globalThis'][callee.object.property.name='crypto'][callee.property.name='randomUUID']",
    message: 'globalThis.crypto.randomUUID는 Chrome 92부터 지원한다.',
  },
]

export function listArtifacts(root) {
  const dist = resolve(root, 'dist')
  const files = existsSync(dist) ? readdirSync(dist, { recursive: true }) : []
  const js = files
    .filter((name) => /\.(?:js|mjs|cjs)$/.test(name))
    .map((name) => join(dist, name))
    .sort()

  if (js.length === 0) {
    throw new Error('dist JS 산출물이 없습니다. `pnpm build` 뒤에 실행하세요.')
  }

  return js
}

export function createAuditor() {
  return new ESLint({
    cwd: packageRoot,
    overrideConfigFile: true,
    allowInlineConfig: false,
    baseConfig: [
      esX.configs['flat/restrict-to-es2019'],
      {
        languageOptions: { ecmaVersion: 'latest', sourceType: 'module' },
        settings: { 'es-x': { aggressive: true } },
        rules: {
          ...collisionRuleOverrides,
          ...allowedChrome75Rules,
          'no-restricted-syntax': ['error', ...unsupportedChrome75WebApis],
        },
      },
    ],
  })
}

const run = async () => {
  const artifacts = listArtifacts(packageRoot)
  console.log(`[check:chrome75] ${artifacts.length}개 JS 산출물 검사`)
  for (const artifact of artifacts) {
    console.log(`[check:chrome75] ${relative(packageRoot, artifact)}`)
  }

  const auditor = createAuditor()
  const results = await auditor.lintFiles(artifacts)
  const diagnosticCount = results.reduce(
    (count, result) => count + result.errorCount + result.warningCount,
    0,
  )

  if (diagnosticCount > 0) {
    const formatter = await auditor.loadFormatter('stylish')
    console.error(await formatter.format(results))
    console.error(`[check:chrome75] Chrome 75 미지원 사용 ${diagnosticCount}건`)
    process.exitCode = 1
    return
  }

  console.log(`[check:chrome75] ${artifacts.length}개 파일 통과`)
}

const isDirectRun =
  process.argv[1] !== undefined &&
  realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url))

if (isDirectRun) {
  await run()
}

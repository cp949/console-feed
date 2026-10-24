import { execFile } from 'node:child_process'
import {
  existsSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  realpathSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import { createRequire } from 'node:module'
import { tmpdir } from 'node:os'
import { basename, join, relative, resolve } from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import { promisify } from 'node:util'

import esX from 'eslint-plugin-es-x'

const execFileAsync = promisify(execFile)
const require = createRequire(import.meta.url)

const packageRoot = resolve(import.meta.dirname, '..')
const oxlintBin = join(
  resolve(require.resolve('oxlint/package.json'), '..'),
  'bin/oxlint',
)
const esXPluginPath = fileURLToPath(import.meta.resolve('eslint-plugin-es-x'))
const webApiPluginPath = resolve(
  import.meta.dirname,
  'chrome75-web-api-plugin.mjs',
)

const allowedChrome75Rules = new Set([
  'es-x/no-bigint',
  'es-x/no-dynamic-import',
  'es-x/no-export-ns-from',
  'es-x/no-global-this',
  'es-x/no-import-meta',
  'es-x/no-numeric-separators',
  'es-x/no-string-prototype-matchall',
  'es-x/no-symbol-matchall',
])

const collisionPronePattern = /^es-x\/no-(?:iterator|set)-prototype-/

// oxlint는 인라인 지시 주석을 끌 수 없어서 직접 막는다.
const inlineDirectivePattern = /\b(?:eslint|oxlint)-(?:disable|enable)/

const es2019Rules = Object.keys(
  esX.configs['flat/restrict-to-es2019'].rules ?? {},
).filter(
  (ruleId) =>
    !allowedChrome75Rules.has(ruleId) && !collisionPronePattern.test(ruleId),
)

const oxlintConfig = {
  plugins: [],
  categories: { correctness: 'off' },
  jsPlugins: [esXPluginPath, webApiPluginPath],
  settings: { 'es-x': { aggressive: true } },
  rules: {
    ...Object.fromEntries(es2019Rules.map((ruleId) => [ruleId, 'error'])),
    'chrome75/no-unsupported-web-api': 'error',
  },
}

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

function toMessage(diagnostic) {
  const span = diagnostic.labels?.[0]?.span
  return {
    ruleId: diagnostic.code.replace(/\(([^)]*)\)$/, '/$1'),
    message: diagnostic.message,
    line: span?.line ?? 0,
    column: span?.column ?? 0,
  }
}

// oxlint CLI로 파일을 검사하고 파일마다 { filePath, errorCount, warningCount, messages }를 돌려준다.
async function lintPaths(filePaths) {
  const workDir = mkdtempSync(join(tmpdir(), 'console-feed-chrome75-'))
  try {
    const configPath = join(workDir, 'oxlintrc.json')
    writeFileSync(configPath, JSON.stringify(oxlintConfig))

    let stdout
    try {
      ;({ stdout } = await execFileAsync(
        process.execPath,
        [oxlintBin, '-c', configPath, '-f', 'json', ...filePaths],
        { cwd: packageRoot, maxBuffer: 64 * 1024 * 1024 },
      ))
    } catch (error) {
      // 진단이 있으면 exit code 1이다. 그 외 실패는 설정·실행 오류다.
      if (error.code !== 1 || !error.stdout) throw error
      stdout = error.stdout
    }

    const { diagnostics } = JSON.parse(stdout)
    return filePaths.map((filePath) => {
      const messages = diagnostics
        .filter((diagnostic) => resolve(diagnostic.filename) === filePath)
        .map(toMessage)
      if (inlineDirectivePattern.test(readFileSync(filePath, 'utf8'))) {
        messages.push({
          ruleId: 'chrome75/no-inline-directive',
          message: 'lint 지시 주석은 허용하지 않는다.',
          line: 0,
          column: 0,
        })
      }
      return {
        filePath,
        errorCount: messages.length,
        warningCount: 0,
        messages,
      }
    })
  } finally {
    rmSync(workDir, { force: true, recursive: true })
  }
}

export function createAuditor() {
  return {
    lintFiles: (filePaths) => lintPaths(filePaths.map((p) => resolve(p))),
    async lintText(text, { filePath }) {
      const workDir = mkdtempSync(join(tmpdir(), 'console-feed-chrome75-'))
      try {
        const probePath = join(workDir, basename(filePath))
        writeFileSync(probePath, text)
        return await lintPaths([probePath])
      } finally {
        rmSync(workDir, { force: true, recursive: true })
      }
    },
  }
}

function formatResults(results) {
  return results
    .filter((result) => result.messages.length > 0)
    .map((result) =>
      [
        relative(packageRoot, result.filePath),
        ...result.messages.map(
          (m) => `  ${m.line}:${m.column}  ${m.ruleId}  ${m.message}`,
        ),
      ].join('\n'),
    )
    .join('\n\n')
}

const run = async () => {
  const artifacts = listArtifacts(packageRoot)
  console.log(`[check:chrome75] ${artifacts.length}개 JS 산출물 검사`)
  for (const artifact of artifacts) {
    console.log(`[check:chrome75] ${relative(packageRoot, artifact)}`)
  }

  const results = await createAuditor().lintFiles(artifacts)
  const diagnosticCount = results.reduce(
    (count, result) => count + result.errorCount + result.warningCount,
    0,
  )

  if (diagnosticCount > 0) {
    console.error(formatResults(results))
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

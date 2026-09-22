import { execFileSync } from 'node:child_process'
import {
  cpSync,
  existsSync,
  mkdtempSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  renameSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { createRequire } from 'node:module'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const fixtureRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const repositoryRoot = resolve(fixtureRoot, '../..')
const packageRoot = resolve(repositoryRoot, 'packages/console-feed')

export function resolvePackedPackage(installationRoot) {
  const require = createRequire(join(installationRoot, 'package.json'))
  const packageJson = require.resolve('@cp949/console-feed/package.json')
  const nodeModulesRoot = resolve(installationRoot, 'node_modules')

  if (!packageJson.startsWith(`${nodeModulesRoot}/`)) {
    throw new Error(
      `설치 패키지가 node_modules 밖에서 해석됩니다: ${packageJson}`,
    )
  }

  return packageJson
}

export function createPackDirectory(packDirectory) {
  mkdirSync(packDirectory, { recursive: true })
  return packDirectory
}

export function writeStandalonePnpmConfig(installationRoot) {
  const configPath = join(installationRoot, 'pnpm-workspace.yaml')
  writeFileSync(configPath, 'allowBuilds:\n  core-js: true\n')
  return configPath
}

function run(command, arguments_, cwd) {
  execFileSync(command, arguments_, { cwd, stdio: 'inherit' })
}

function findTarball(packDirectory) {
  const tarballs = readdirSync(packDirectory).filter((file) =>
    file.endsWith('.tgz'),
  )

  if (tarballs.length !== 1) {
    throw new Error(
      `npm pack tarball이 하나여야 합니다: ${tarballs.join(', ')}`,
    )
  }

  return join(packDirectory, tarballs[0])
}

function listJavaScriptArtifacts(outputDirectory) {
  const files = readdirSync(outputDirectory, { recursive: true })
    .filter(
      (file) => typeof file === 'string' && /\.(?:js|mjs|cjs)$/.test(file),
    )
    .map((file) => join(outputDirectory, file))
    .sort()

  if (files.length === 0) {
    throw new Error(`Vite JS 산출물이 없습니다: ${outputDirectory}`)
  }

  return files
}

export function assertNoOptionalChaining(outputDirectory) {
  const files = listJavaScriptArtifacts(outputDirectory)

  const unlowered = files.filter((file) =>
    /\?\./.test(readFileSync(file, 'utf8')),
  )
  if (unlowered.length > 0) {
    throw new Error(
      `Chrome 75 미변환 optional chaining: ${unlowered.map((file) => relative(outputDirectory, file)).join(', ')}`,
    )
  }

  return files
}

export function assertChrome75Bundle(outputDirectory) {
  const indexPath = join(outputDirectory, 'index.html')
  if (!existsSync(indexPath)) {
    throw new Error(`Vite index.html 산출물이 없습니다: ${indexPath}`)
  }

  const artifacts = assertNoOptionalChaining(outputDirectory)
  const entryAssets = [
    ...readFileSync(indexPath, 'utf8').matchAll(/src="([^"]+)"/g),
  ]
    .map((match) => match[1])
    .filter((asset) => /\.(?:js|mjs|cjs)$/.test(asset))

  if (entryAssets.length === 0) {
    throw new Error(`Vite JavaScript entry asset이 없습니다: ${indexPath}`)
  }

  for (const asset of entryAssets) {
    const assetPath = join(outputDirectory, asset.replace(/^\//, ''))
    if (!artifacts.includes(assetPath)) {
      throw new Error(`Vite entry asset을 찾을 수 없습니다: ${assetPath}`)
    }
  }

  return artifacts
}

export function replaceOutputDirectory(nextOutput, outputDirectory) {
  const backupOutput = `${outputDirectory}.backup-${process.pid}-${Date.now()}`
  let movedPreviousOutput = false
  let movedNextOutput = false

  try {
    if (existsSync(outputDirectory)) {
      renameSync(outputDirectory, backupOutput)
      movedPreviousOutput = true
    }

    renameSync(nextOutput, outputDirectory)
    movedNextOutput = true
  } catch (error) {
    if (movedNextOutput && existsSync(outputDirectory)) {
      renameSync(outputDirectory, nextOutput)
    }
    if (movedPreviousOutput && existsSync(backupOutput)) {
      renameSync(backupOutput, outputDirectory)
    }
    throw error
  }

  if (movedPreviousOutput) {
    rmSync(backupOutput, { recursive: true, force: true })
  }

  return outputDirectory
}

function copyFixture(tempFixture) {
  cpSync(fixtureRoot, tempFixture, {
    recursive: true,
    filter(source) {
      const name = source.split('/').pop()
      return name !== 'dist' && name !== 'node_modules'
    },
  })
}

function stageOutput(temporaryOutput) {
  const stagingRoot = mkdtempSync(join(fixtureRoot, '.chrome75-output-'))
  const stagedOutput = join(stagingRoot, 'dist')
  cpSync(temporaryOutput, stagedOutput, { recursive: true })
  return { stagingRoot, stagedOutput }
}

export function buildPacked() {
  const temporaryRoot = mkdtempSync(
    join(tmpdir(), 'console-feed-chrome75-packed-'),
  )
  const packDirectory = join(temporaryRoot, 'pack')
  const temporaryFixture = join(temporaryRoot, 'fixture')
  let stagingRoot

  try {
    run('pnpm', ['--filter', '@cp949/console-feed', 'build'], repositoryRoot)
    createPackDirectory(packDirectory)
    run('npm', ['pack', '--pack-destination', packDirectory], packageRoot)

    const tarball = findTarball(packDirectory)
    copyFixture(temporaryFixture)
    writeStandalonePnpmConfig(temporaryFixture)

    const manifestPath = join(temporaryFixture, 'package.json')
    const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'))
    manifest.dependencies['@cp949/console-feed'] = `file:${tarball}`
    writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`)

    run('pnpm', ['install', '--config.minimumReleaseAge=0'], temporaryFixture)

    const packageJson = resolvePackedPackage(temporaryFixture)
    run('pnpm', ['build'], temporaryFixture)

    const temporaryOutput = join(temporaryFixture, 'dist')
    assertChrome75Bundle(temporaryOutput)
    const outputDirectory = join(fixtureRoot, 'dist')
    const stagedOutput = stageOutput(temporaryOutput)
    stagingRoot = stagedOutput.stagingRoot
    replaceOutputDirectory(stagedOutput.stagedOutput, outputDirectory)
    const artifacts = assertChrome75Bundle(outputDirectory)

    process.stdout.write(`PACKED_PACKAGE=${packageJson}\n`)
    process.stdout.write(`PACKED_OUTPUT=${outputDirectory}\n`)
    process.stdout.write(`PACKED_JS_FILES=${artifacts.length}\n`)

    return { packageJson, outputDirectory, artifacts }
  } finally {
    if (stagingRoot && existsSync(stagingRoot)) {
      rmSync(stagingRoot, { recursive: true, force: true })
    }
    if (existsSync(temporaryRoot)) {
      rmSync(temporaryRoot, { recursive: true, force: true })
    }
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  buildPacked()
}

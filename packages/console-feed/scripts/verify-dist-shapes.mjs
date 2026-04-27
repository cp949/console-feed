#!/usr/bin/env node
// dist 런타임 shape 회귀 가드.
// default-only subpath (hook/unhook/component) 가 CJS 에서 함수로,
// ESM 에서도 default 가 함수로 노출되는지 검증한다.
// 3.6.7 회귀(`Hook is not a function`) 재발 방지가 목적.

import { createRequire } from 'node:module'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { dirname, resolve } from 'node:path'
import { existsSync } from 'node:fs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const pkgRoot = resolve(__dirname, '..')
const require = createRequire(import.meta.url)

const failures = []

function check(label, cond) {
  if (cond) {
    console.log(`  ok   ${label}`)
  } else {
    console.log(`  FAIL ${label}`)
    failures.push(label)
  }
}

function cjsPath(rel) {
  return resolve(pkgRoot, rel)
}

function esmUrl(rel) {
  return pathToFileURL(resolve(pkgRoot, rel)).href
}

const cjsTargets = [
  'dist/Hook/index.js',
  'dist/Unhook/index.js',
  'dist/Component/index.js',
  'dist/Transform/index.js',
  'dist/index.js',
]
for (const rel of cjsTargets) {
  if (!existsSync(cjsPath(rel))) {
    failures.push(`missing ${rel}`)
    console.log(`  FAIL missing ${rel}`)
  }
}
if (failures.length) {
  console.error('\ndist 산출물이 없습니다. `pnpm build` 후 다시 실행하세요.')
  process.exit(1)
}

console.log('CJS shape:')
const cjsHook = require(cjsPath('dist/Hook/index.js'))
check(
  'require(./dist/Hook/index.js) is function',
  typeof cjsHook === 'function',
)

const cjsUnhook = require(cjsPath('dist/Unhook/index.js'))
check(
  'require(./dist/Unhook/index.js) is function',
  typeof cjsUnhook === 'function',
)

const cjsComponent = require(cjsPath('dist/Component/index.js'))
check(
  'require(./dist/Component/index.js) is function',
  typeof cjsComponent === 'function',
)

const cjsTransform = require(cjsPath('dist/Transform/index.js'))
check(
  'require(./dist/Transform/index.js).Decode is function',
  typeof cjsTransform.Decode === 'function',
)
check(
  'require(./dist/Transform/index.js).Encode is function',
  typeof cjsTransform.Encode === 'function',
)

const cjsRoot = require(cjsPath('dist/index.js'))
check(
  'require(./dist/index.js).Hook is function',
  typeof cjsRoot.Hook === 'function',
)
check(
  'require(./dist/index.js).Unhook is function',
  typeof cjsRoot.Unhook === 'function',
)
check(
  'require(./dist/index.js).Console is function',
  typeof cjsRoot.Console === 'function',
)
check(
  'require(./dist/index.js).Decode is function',
  typeof cjsRoot.Decode === 'function',
)

console.log('ESM shape:')
const esmHook = await import(esmUrl('dist/Hook/index.mjs'))
check(
  'import default ./dist/Hook/index.mjs is function',
  typeof esmHook.default === 'function',
)

const esmUnhook = await import(esmUrl('dist/Unhook/index.mjs'))
check(
  'import default ./dist/Unhook/index.mjs is function',
  typeof esmUnhook.default === 'function',
)

const esmComponent = await import(esmUrl('dist/Component/index.mjs'))
check(
  'import default ./dist/Component/index.mjs is function',
  typeof esmComponent.default === 'function',
)

const esmTransform = await import(esmUrl('dist/Transform/index.mjs'))
check(
  'import { Decode } ./dist/Transform/index.mjs is function',
  typeof esmTransform.Decode === 'function',
)
check(
  'import { Encode } ./dist/Transform/index.mjs is function',
  typeof esmTransform.Encode === 'function',
)

const esmRoot = await import(esmUrl('dist/index.mjs'))
check(
  'import { Hook } ./dist/index.mjs is function',
  typeof esmRoot.Hook === 'function',
)
check(
  'import { Unhook } ./dist/index.mjs is function',
  typeof esmRoot.Unhook === 'function',
)
check(
  'import { Console } ./dist/index.mjs is function',
  typeof esmRoot.Console === 'function',
)
check(
  'import { Decode } ./dist/index.mjs is function',
  typeof esmRoot.Decode === 'function',
)

if (failures.length) {
  console.error(`\n${failures.length}건의 dist shape 검증 실패.`)
  process.exit(1)
}
console.log('\n모든 dist shape 검증 통과.')

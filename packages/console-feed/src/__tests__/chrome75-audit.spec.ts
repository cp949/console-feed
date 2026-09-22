import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'

import { afterEach, describe, expect, it } from 'vitest'

import { createAuditor, listArtifacts } from '../../scripts/check-chrome75.mjs'

const temporaryRoots: string[] = []

const createTemporaryRoot = () => {
  const root = mkdtempSync(join(tmpdir(), 'console-feed-chrome75-'))
  temporaryRoots.push(root)
  return root
}

afterEach(() => {
  for (const root of temporaryRoots.splice(0)) {
    rmSync(root, { force: true, recursive: true })
  }
})

describe('Chrome 75 배포 산출물 검사', () => {
  it('dist JavaScript 산출물이 없으면 실패한다', () => {
    const root = createTemporaryRoot()

    expect(() => listArtifacts(root)).toThrow(/dist|JS/)
  })

  it('dist 아래 공유 ESM 청크를 검사 대상으로 포함한다', () => {
    const root = createTemporaryRoot()
    mkdirSync(join(root, 'dist'))
    writeFileSync(join(root, 'dist', 'shared.mjs'), 'export {}')

    expect(listArtifacts(root)).toContain(resolve(root, 'dist/shared.mjs'))
  })

  it('Chrome 75에 없는 Array.prototype.findLast 호출을 보고한다', async () => {
    const auditor = createAuditor()

    const [result] = await auditor.lintText(
      'const values = []; values.findLast(() => true)',
      { filePath: 'probe.mjs' },
    )

    expect(result.errorCount).toBeGreaterThan(0)
  })

  it('Chrome 75에 없는 crypto.randomUUID 호출을 보고한다', async () => {
    const auditor = createAuditor()

    const [result] = await auditor.lintText('crypto.randomUUID()', {
      filePath: 'probe.mjs',
    })

    expect(result.errorCount).toBeGreaterThan(0)
  })

  it('Chrome 75이 지원하는 globalThis 사용은 허용한다', async () => {
    const auditor = createAuditor()

    const [result] = await auditor.lintText('globalThis.console.log(1)', {
      filePath: 'probe.mjs',
    })

    expect(result.errorCount).toBe(0)
  })
})

import { promises as fs } from 'node:fs'
import { dirname, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const srcDir = join(root, 'src')
const distDir = join(root, 'dist')

async function* walk(dir) {
  for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) {
      if (entry.name === '__tests__') continue
      yield* walk(full)
    } else if (entry.name.endsWith('.d.ts')) {
      yield full
    }
  }
}

let copied = 0
for await (const file of walk(srcDir)) {
  const rel = relative(srcDir, file)
  const dest = join(distDir, rel)
  await fs.mkdir(dirname(dest), { recursive: true })
  await fs.copyFile(file, dest)
  copied++
}
console.log(`Copied ${copied} ambient .d.ts files into dist/`)

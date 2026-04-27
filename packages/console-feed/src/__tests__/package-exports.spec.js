const fs = require('fs')
const path = require('path')

describe('package exports', () => {
  const packageJson = JSON.parse(
    fs.readFileSync(path.resolve(__dirname, '../../package.json'), 'utf8'),
  )

  it('exposes the root package and stable public subpaths from dist', () => {
    expect(packageJson.exports).toEqual({
      '.': {
        types: './dist/index.d.ts',
        default: './dist/index.js',
      },
      './component': {
        types: './dist/Component/index.d.ts',
        default: './dist/Component/index.js',
      },
      './hook': {
        types: './dist/Hook/index.d.ts',
        default: './dist/Hook/index.js',
      },
      './unhook': {
        types: './dist/Unhook/index.d.ts',
        default: './dist/Unhook/index.js',
      },
      './transform': {
        types: './dist/Transform/index.d.ts',
        default: './dist/Transform/index.js',
      },
      './package.json': './package.json',
    })
  })
})

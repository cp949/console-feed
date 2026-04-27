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
        import: './dist/index.mjs',
        require: './dist/index.js',
      },
      './component': {
        types: './dist/Component/index.d.ts',
        import: './dist/Component/index.mjs',
        require: './dist/Component/index.js',
      },
      './hook': {
        types: './dist/Hook/index.d.ts',
        import: './dist/Hook/index.mjs',
        require: './dist/Hook/index.js',
      },
      './unhook': {
        types: './dist/Unhook/index.d.ts',
        import: './dist/Unhook/index.mjs',
        require: './dist/Unhook/index.js',
      },
      './transform': {
        types: './dist/Transform/index.d.ts',
        import: './dist/Transform/index.mjs',
        require: './dist/Transform/index.js',
      },
      './package.json': './package.json',
    })
  })
})

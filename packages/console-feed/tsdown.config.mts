import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    'Component/index': 'src/Component/index.tsx',
    'Hook/index': 'src/Hook/index.ts',
    'Unhook/index': 'src/Unhook/index.ts',
    'Transform/index': 'src/Transform/index.ts',
  },
  format: ['esm', 'cjs'],
  dts: false,
  sourcemap: true,
  clean: true,
  treeshake: true,
  platform: 'neutral',
  target: 'chrome75',
  outDir: 'dist',
  tsconfig: './tsconfig.build.json',
  deps: {
    neverBundle: [
      'react',
      'react-dom',
      '@emotion/react',
      '@emotion/styled',
      'dompurify',
      'linkify-html',
      'linkify-react',
      'linkifyjs',
      'react-inline-center',
      'react-inspector',
    ],
  },
})

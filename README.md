# console-feed

[한국어](README.ko.md) | English

A React component that captures and displays browser console output in a user interface. Works with React 18+ apps and is sanitized for both browser and server environments.

## About This Fork

This repository is a fork of [samdenty/console-feed](https://github.com/samdenty/console-feed) v3.6.0, enhanced with security improvements and updated dependencies.

### Why This Fork?

- **Security First**: Eliminated 24 security vulnerabilities from the original repository
- **Modern Stack**: Updated to latest stable versions of all dependencies
- **Better Architecture**: Restructured as a Turborepo monorepo for cleaner dependency management
- **Production Ready**: Zero vulnerabilities, comprehensive test coverage, optimized build pipeline

## Key Improvements

### Security Enhancements
- ✅ Upgraded react-inspector to 9.0.0 (removed @babel/runtime vulnerabilities)
- ✅ Migrated from Jest to Vitest 4.0.10 (resolved 22 dependency chain vulnerabilities)
- ✅ Added prototype pollution defense (`__proto__`, `constructor`, `prototype` key filtering)
- ✅ Implemented DOM purification via isomorphic-dompurify
- ✅ Added serialization depth limits to prevent DoS attacks

### Modern Development Stack
- **TypeScript 5.9.3**: ES6 compilation target
- **Vitest 4.0.10**: Fast testing with clean dependency tree
- **Turborepo**: Optimized monorepo builds with intelligent caching
- **pnpm workspace**: Strict dependency management preventing phantom dependencies

### Project Structure
```
console-feed/
├── apps/
│   └── demo/              # Demo application (Vite + React)
├── packages/
│   └── console-feed/      # Library core
├── turbo.json             # Turborepo configuration
├── pnpm-workspace.yaml    # pnpm workspace setup
└── package.json           # Root workspace
```

## Package Information

- **npm package**: [@cp949/console-feed](https://www.npmjs.com/package/@cp949/console-feed)
- **GitHub**: [cp949/console-feed](https://github.com/cp949/console-feed)

## Quick Start

### For Library Users

Install the package:
```bash
pnpm add @cp949/console-feed
# or
yarn add @cp949/console-feed
# or
npm install @cp949/console-feed
```

See the [package README](packages/console-feed/README.md) for usage documentation.

### For Contributors/Developers

**Requirements:**
- Node 20+
- pnpm 9+

**Development Commands:**
```bash
# Install dependencies
pnpm install

# Run demo app
pnpm dev

# Build all packages
pnpm build

# Run all tests
pnpm test

# Run specific package
pnpm --filter @cp949/console-feed build    # Build library
pnpm --filter demo dev                      # Run demo only
pnpm --filter @cp949/console-feed test     # Test library
```

## Security Status

**Current Status (2025-11-18)**
- ✅ `pnpm audit`: 0 vulnerabilities
- ✅ All tests passing: 28/28
- ✅ TypeScript 5.9.3
- ✅ Vitest 4.0.10
- ✅ react-inspector 9.0.0

**Resolved Vulnerabilities:**
1. **@babel/runtime** (Moderate, 2 issues) - Removed via react-inspector 9.0.0 upgrade
2. **Jest dependencies** (22 issues) - Eliminated via Vitest 4.0.10 migration

## Release Process

Only the library package (`@cp949/console-feed`) is published to npm. The demo app is marked as `private: true`.

```bash
# 1. Verify tests and builds
pnpm test
pnpm build

# 2. Navigate to package
cd packages/console-feed

# 3. Update version
pnpm version patch  # or minor, major

# 4. Commit and push
git add .
git commit -m "Release vX.X.X"
git push

# 5. Publish to npm
pnpm publish
```

## Architecture Benefits

**Turborepo + pnpm workspace**:
- Clear separation between library and demo dependencies
- Intelligent build caching (skip unchanged packages)
- 30-50% faster build times via Turborepo

**pnpm advantages**:
- Prevents phantom dependencies through strict dependency resolution
- Efficient disk usage via hard-link based storage
- Optimized integration with Turborepo

## License

Follows the original repository's license (MIT).

## Links

- **Original Repository**: [samdenty/console-feed](https://github.com/samdenty/console-feed)
- **Package Documentation**: [packages/console-feed/README.md](packages/console-feed/README.md)
- **Issues**: [GitHub Issues](https://github.com/cp949/console-feed/issues)

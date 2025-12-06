# console-feed Monorepo

[한국어](README.ko.md) | English

This repository is a monorepo that manages the `@cp949/console-feed` library and related development tools.

## Overview

`console-feed` is a library that captures browser console output and displays it as a React component. It supports both React 18 and 19.

This repository is a fork of [samdenty/console-feed](https://github.com/samdenty/console-feed) v3.6.0 with security vulnerability fixes.

## Project Structure

```
console-feed/
├── apps/
│   └── demo/              # Demo application (Vite + React)
├── packages/
│   └── console-feed/      # Library core (@cp949/console-feed)
├── scripts/               # Shared scripts
├── turbo.json             # Turborepo configuration
├── pnpm-workspace.yaml    # pnpm workspace setup
└── package.json           # Root workspace configuration
```

### Packages

- **`@cp949/console-feed`**: Main library package
  - npm: [@cp949/console-feed](https://www.npmjs.com/package/@cp949/console-feed)
  - Documentation: [packages/console-feed/README.md](packages/console-feed/README.md)

- **`apps/demo`**: Demo application
  - Provides library usage examples
  - Demonstrates various usage scenarios
  - Used for testing the library during development

## Quick Start

### For Library Users

Install the package:

```bash
npm install @cp949/console-feed
```

See the [package README](packages/console-feed/README.md) for usage documentation.

### For Developers

**Requirements:**

- Node 20+
- pnpm 9+

**Setup:**

```bash
# Install dependencies
pnpm install
```

**Development Commands:**

```bash
# Run demo app (http://localhost:3000)
pnpm dev

# Build all packages
pnpm build

# Run all tests
pnpm test

# Code linting
pnpm lint
pnpm lint:fix

# Code formatting
pnpm format
pnpm format:check

# Run specific package only
pnpm --filter @cp949/console-feed build    # Build library
pnpm --filter demo dev                      # Run demo only
pnpm --filter @cp949/console-feed test     # Test library
```

**React Compatibility Testing:**

```bash
# Test both React 18 and 19
pnpm test:compat

# Test React 18 only
pnpm test:react18

# Test React 19 only
pnpm test:react19
```

## Development Stack

- **Build System**: Turborepo
- **Package Manager**: pnpm workspace
- **Language**: TypeScript 5.9.3
- **Testing**: Vitest 4.0.10
- **Code Quality**: ESLint 9, Prettier
- **React Support**: 18, 19

## Key Changes (from original)

### Security Vulnerability Fixes

- react-inspector 9.0.0 upgrade: removed @babel/runtime vulnerabilities
- Jest → Vitest 4.0.10 migration: resolved 22 dependency chain vulnerabilities
- Prototype pollution defense: `__proto__`, `constructor`, `prototype` key filtering
- DOM sanitization: isomorphic-dompurify applied
- Serialization depth limits added

### Development Environment Improvements

- Turborepo integration for optimized build/test pipeline
- pnpm workspace for efficient dependency management
- ESLint 9 Flat Config migration
- Automated React 18/19 compatibility testing

## Security Status

- `pnpm audit`: 0 vulnerabilities
- Tests: 28/28 passing

Resolved vulnerabilities:

- @babel/runtime (Moderate, 2 issues): removed via react-inspector 9.0.0 upgrade
- Jest dependencies (22 issues): eliminated via Vitest 4.0.10 migration

## Release Process

Only the library package (`@cp949/console-feed`) is published to npm. The demo app is set to `private: true`.

```bash
# 1. Verify tests and builds
pnpm test
pnpm build

# 2. Navigate to package directory
cd packages/console-feed

# 3. Update version
pnpm version patch  # or minor, major

# 4. Commit and push changes
git add .
git commit -m "Release vX.X.X"
git push

# 5. Publish to npm
pnpm publish
```

## Contributing

Issues and pull requests are welcome. Before contributing, please ensure:

1. Code style: Run `pnpm lint` and `pnpm format`
2. Tests: Ensure `pnpm test` passes
3. Build: Ensure `pnpm build` succeeds

## License

Follows the original repository's license (MIT).

## Links

- **Original Repository**: [samdenty/console-feed](https://github.com/samdenty/console-feed)
- **Package Documentation**: [packages/console-feed/README.md](packages/console-feed/README.md)
- **npm Package**: [@cp949/console-feed](https://www.npmjs.com/package/@cp949/console-feed)
- **Issues**: [GitHub Issues](https://github.com/cp949/console-feed/issues)

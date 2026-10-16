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

The package root keeps the existing public API. Non-UI utilities are also available through stable subpaths:

```tsx
import { Console, Hook, Decode, Unhook } from '@cp949/console-feed'
import HookOnly from '@cp949/console-feed/hook'
import { Decode as DecodeOnly } from '@cp949/console-feed/transform'
```

See the [package README](packages/console-feed/README.md) for usage documentation.

### For Developers

**Requirements:**

- Node `^22.18.0 || ^24.11.0 || >=26.0.0`
- pnpm `11.27.1`

**Setup:**

```bash
# Install dependencies
pnpm install
```

**Development Commands:**

```bash
# Run demo app (http://localhost:5173)
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

### Chrome 75 library artifacts

The library artifacts target Chrome 75. The package does not inject global polyfills. Consumers do not need to install `core-js`.

Verification commands:

- `pnpm --filter @cp949/console-feed check:chrome75`: statically audits the built package output.
- `node fixtures/chrome75-consumer/scripts/build-packed.mjs`: checks the packed tarball installed in a standalone consumer project.
- `bash scripts/test-chrome75.sh`: runs the exact-browser smoke test with Docker on Linux.

Recorded smoke test result:

- Environment: Linux Docker, Node 24, Chromium/HeadlessChrome `75.0.3770.90`.
- Result: the packed consumer passed the capture, decode, render, restoration, and style checks. There were no fixture or CDP errors.
- Image: installs Chromium from a pinned 2019 Debian snapshot over HTTPS and verifies the deb SHA-1. `trusted=yes` applies only to that snapshot source.
- Not run: Podman and Node 22.
- Scope: only the computed style checks in the fixture. Broader CSS behavior, other browser engines, and other operating systems remain unverified.

## Development Stack

- **Build System**: Turborepo
- **Package Manager**: pnpm workspace
- **Language**: TypeScript
- **Testing**: Vitest
- **Code Quality**: ESLint and Prettier
- **React Support**: 18, 19

## Release Process

Only the library package (`@cp949/console-feed`) is published to npm. The demo app is set to `private: true`.

Before releasing, update and commit `packages/console-feed/CHANGELOG.md`; `release-it` requires a clean working tree.

```bash
# Starts the interactive release flow from the repository root.
pnpm release-it
```

The flow updates only `packages/console-feed/package.json`, runs the package `prepublishOnly` gate (`build`, `test`, `test:dist`), publishes to npm, then interactively confirms the release commit, `v<version>` tag, and push. Use the prompts to choose the version and approve each external action.

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

# console-feed

[한국어](README.ko.md) | English

A React component that captures and displays browser console output in a user interface. Works with React 18+ apps and is sanitized for both browser and server environments.

This is a fork of [samdenty/console-feed](https://github.com/samdenty/console-feed) v3.6.0 with security improvements and updated dependencies.

## Installation

```sh
pnpm add @cp949/console-feed
# or
yarn add @cp949/console-feed
# or
npm install @cp949/console-feed
```

Package info: https://www.npmjs.com/package/@cp949/console-feed

## Changes from Original Repository

### Security Improvements
- Upgraded react-inspector to 9.0.0 (removed @babel/runtime vulnerabilities)
- Migrated Jest → Vitest 4.0.10 (fundamentally resolved test dependency vulnerabilities)
- Added prototype pollution defense (`__proto__`, `constructor`, `prototype` key blocking)
- Applied DOM purification via isomorphic-dompurify
- Added DoS attack prevention through serialization depth limits

### Updated Dependencies
- Applied TypeScript 5.9.3 (compilation target: ES3 → ES6)
- React 18+ support (React Native not supported)
- Node 20+ baseline
- Migrated Jest → Vitest 4.0.10 (faster test execution, clean dependency tree)

### Project Structure
- Converted to Turborepo monorepo structure
- pnpm workspace-based dependency management
- Separated library (`packages/console-feed`) and demo app (`apps/demo`)
- Optimized build performance with Turborepo caching

### Other Improvements
- Improved link handling via `linkify-html`/`linkify-react`
- Theme system based on `@emotion/react`
- Republished as `@cp949` scoped package

## Features

- Styled console entries with color substitution and clickable links
- Renders DOM nodes, tables, and various console methods (`log`, `warn`, `debug`, `table`, etc.)
- Serialization that safely converts functions, circular structures, and DOM references
- Filtering, search, and log grouping capabilities

## Basic Usage

Class component:

```tsx
import React from 'react'
import { Hook, Console, Decode } from '@cp949/console-feed'

class App extends React.Component {
  state = { logs: [] }

  componentDidMount() {
    Hook(window.console, (log) => {
      this.setState(({ logs }) => ({ logs: [...logs, Decode(log)] }))
    })

    console.log('Hello world!')
  }

  render() {
    return <Console logs={this.state.logs} variant="dark" />
  }
}
```

Function component (Hooks):

```tsx
import React, { useState, useEffect } from 'react'
import { Console, Hook, Unhook } from '@cp949/console-feed'

const LogsContainer = () => {
  const [logs, setLogs] = useState([])

  useEffect(() => {
    const hooked = Hook(
      window.console,
      (log) => setLogs((current) => [...current, log]),
      false
    )
    return () => Unhook(hooked)
  }, [])

  return <Console logs={logs} variant="dark" />
}
```

## API

### Console Component

Props:
- `logs`: Array of log messages
- `filter`: Log filtering function
- `searchKeywords`: Search keywords
- `linkifyOptions`: Link handling options
- `variant`: Theme (`"dark"` | `"light"`)

### Hook Function

Wraps `window.console` or a console-like object to capture logs. Serializes entries with `Encode` and passes them to the callback.

```tsx
Hook(
  console: Console,
  callback: (log: EncodedLog) => void,
  encode?: boolean
): HookedConsole
```

### Unhook Function

Restores a console wrapped by Hook to its original state.

```tsx
Unhook(hookedConsole: HookedConsole): void
```

### Encode / Decode Functions

Used when transmitting logs across network boundaries.

```tsx
Encode<T>(data: any, limit?: number): T
Decode(data: any): Message
```

## Development

This project is structured as a Turborepo monorepo.

### Project Structure

```
console-feed/
├── apps/
│   └── demo/              # Demo app (Vite + React)
├── packages/
│   └── console-feed/      # Library core
├── turbo.json             # Turborepo configuration
├── pnpm-workspace.yaml    # pnpm workspace setup
└── package.json           # Root workspace
```

### Development Requirements

- Node 20+
- pnpm 9+

### Development Commands

```bash
# Install dependencies
pnpm install

# Run development server for entire workspace
pnpm dev

# Build entire workspace
pnpm build

# Test entire workspace
pnpm test

# Run specific package only
pnpm --filter @cp949/console-feed build    # Build library
pnpm --filter demo dev                      # Run demo app only
pnpm --filter @cp949/console-feed test     # Test library
```

### Turborepo Caching

Turborepo automatically caches build results. Unchanged packages skip rebuilding, significantly reducing build time.

## Release

Only the library package (`@cp949/console-feed`) is published to npm. The demo app is set to `private: true`.

```bash
# 1. Verify all tests and builds
pnpm test
pnpm build

# 2. Navigate to packages/console-feed directory
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

Scoped packages are configured with public access by default via `publishConfig`.

## Security

### Current Status (2025-11-18)

`pnpm audit` result: 0 vulnerabilities

Key dependency versions:
- TypeScript 5.9.3
- Vitest 4.0.10
- react-inspector 9.0.0

All tests passing (28/28)

### Resolved Vulnerabilities

1. @babel/runtime vulnerabilities (Moderate, 2 issues)
   - Action: Removed dependency via react-inspector 9.0.0 upgrade
   - Result: react-inspector 9.x does not use @babel/runtime

2. Jest-related vulnerabilities (brace-expansion, glob, minimatch - total 22 issues)
   - Cause: Jest → babel-plugin-istanbul → test-exclude dependency chain
   - Action: Fundamentally resolved via Jest → Vitest 4.0.10 migration
   - Result: Clean dependency tree, no need for yarn resolutions, faster test execution

### Applied Security Mechanisms

- Prototype pollution defense: Blocking `__proto__`, `constructor`, `prototype` key access
- DOM purification: XSS defense via isomorphic-dompurify
- Encode limits: DoS defense through serialization depth limits
- Sanitized parsing: Malicious input filtering during log parsing

### Security Verification

Automated security checks can be performed via verification scripts:

```bash
cd packages/console-feed
./scripts/security-test.sh    # Run security tests
./scripts/verify-all.sh        # Integrated verification (tests, build, security checks)
```

### Package Management

**Turborepo + pnpm workspace**: Clearly separates library and demo app dependencies in a monorepo structure.

**pnpm advantages**:
- Prevents phantom dependency issues through strict dependency management
- Efficient disk space usage via hard-link approach
- Optimized integration with Turborepo

**Vitest 4.0.10**: Has a clean dependency tree, eliminating the need for separate resolutions.

## License

Follows the original repository's license.

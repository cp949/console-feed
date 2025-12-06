# console-feed

[한국어](README.ko.md) | English

A React component that captures and displays browser console output in a user interface. Supports React 18 and 19.

This is a fork of [samdenty/console-feed](https://github.com/samdenty/console-feed) v3.6.0 with security vulnerability fixes.

## Installation

```sh
npm install @cp949/console-feed
```

Package info: https://www.npmjs.com/package/@cp949/console-feed

## Changes

### Security Vulnerability Fixes

- react-inspector 9.0.0 upgrade: removed @babel/runtime vulnerabilities
- Jest → Vitest 4.0.10 migration: resolved 22 dependency chain vulnerabilities
- Prototype pollution defense: `__proto__`, `constructor`, `prototype` key filtering
- DOM sanitization: isomorphic-dompurify applied
- Serialization depth limits added

### Dependency Updates

- TypeScript 5.9.3
- React 18, 19 support
- Node 20+ baseline
- Vitest 4.0.10

## Features

- Styled console entries (color substitution, clickable links)
- Renders DOM nodes, tables, various console methods
- Serialization (functions, circular structures, DOM references)
- Filtering and search
- Error stack trace display
- Performance measurement (`console.time`/`timeEnd` support)
- Dark/light theme support

## Basic Usage

Function component (Hooks):

```tsx
import React, { useState, useEffect } from 'react'
import { Console, Hook, Decode, Unhook } from '@cp949/console-feed'
import type { Message } from '@cp949/console-feed/src/definitions/Component'

const LogsContainer = () => {
  const [logs, setLogs] = useState<Message[]>([])

  useEffect(() => {
    const hookedConsole = Hook(
      window.console,
      (encoded, message) => {
        // When encode is true: encoded is a serialized message, so Decode is required
        // When encode is false: encoded is a parsed message, but using Decode is safe
        const decoded = Decode(encoded)
        const logMessage: Message = {
          ...decoded,
          id: `log-${Date.now()}-${Math.random()}`,
          data: decoded.data || [],
        }
        setLogs((prevLogs) => [...prevLogs, logMessage])
      },
      true, // encode: true - serialization for network transfer
      100, // limit: 100 - serialization depth limit
    )

    // Cleanup: Unhook when component unmounts
    return () => {
      Unhook(hookedConsole)
    }
  }, [])

  return <Console logs={logs} variant="dark" />
}
```

## API

### Console Component

A React component that displays log messages.

**Props:**

- `logs`: Array of log messages (`Message[]`) - **Required**
- `variant?`: Theme (`"dark"` | `"light"`, default: `"dark"`)
- `styles?`: Custom style object
- `filter?`: Method filter array (`Methods[]`) - Display only specified methods
- `searchKeywords?`: Search keyword string - Regex search in log content
- `logFilter?`: Log filtering function - Custom filtering logic when used with `searchKeywords`
- `logGrouping?`: Enable log grouping (default: `true`) - Group identical logs and display with `amount`
- `linkifyOptions?`: linkifyjs options object - URL link handling options
- `components?`: Component override object - Replace with custom components

### Hook Function

Wraps `window.console` or a console-like object to capture logs.

```tsx
Hook(
  console: Console,
  callback: (encoded: Message, message: Payload) => void,
  encode?: boolean,  // Default: true
  limit?: number     // Default: 100 (serialization depth limit)
): HookedConsole
```

**Parameters:**

- `console`: Console object to hook
- `callback`: Callback function called when a log is captured
  - `encoded`: Log message (first argument)
    - When `encode` is `true`: Serialized message (suitable for network transfer/storage)
    - When `encode` is `false`: Parsed message (not serialized, for use in the same memory space)
  - `message`: Parsed message (second argument, always non-serialized parsed result)
- `encode`: Whether to serialize logs (default: `true`)
  - `true`: Serialize parsed messages for network transfer or localStorage storage
  - `false`: Use parsed messages without serialization (more efficient when used in the same memory space)
- `limit`: Serialization depth limit (default: `100`, only applies when `encode` is `true`)

**Return Value:**

- `HookedConsole`: Hooked Console object (can be passed to Unhook)

### Unhook Function

Restores a console wrapped by Hook to its original state. Must be called when the component unmounts.

```tsx
Unhook(hookedConsole: HookedConsole): boolean
```

**Parameters:**

- `hookedConsole`: Console object wrapped by Hook

**Return Value:**

- `boolean`: Success status (`true`: success, `false`: failure)

### Encode / Decode Functions

Used when transmitting logs across network boundaries.

```tsx
Encode<T>(data: any, limit?: number): T
Decode(data: any): Message
```

**Encode:**

- Converts log objects into JSON-serializable format
- Safely converts functions, circular references, DOM nodes, etc.
- `limit`: Serialization depth limit (default: 100)
- **Return Value**: Flat object structure that can be serialized to JSON
  - Complex types (functions, DOM nodes, etc.) from the original object are converted with special type markers
  - Can be safely serialized with `JSON.stringify()`
  - Suitable for network transfer, localStorage storage, etc.

**Decode:**

- Deserializes serialized logs into `Message` objects
- Returns a complete log object including the `method` property
- **Important**:
  - When `encode` is `true`: The first argument (`encoded`) of the callback is a serialized message, so `Decode` must be called
  - When `encode` is `false`: The first argument (`encoded`) of the callback is a parsed message, but calling `Decode` is recommended for safe usage

**Usage Example:**

```tsx
import { Encode, Decode } from '@cp949/console-feed'

// 1. Create log message
const logMessage = {
  method: 'log' as const,
  data: [
    'Hello World',
    { name: 'console-feed', version: '3.6.5' },
    [1, 2, 3],
  ],
  timestamp: new Date().toISOString(),
}

// 2. Encode: Serialize for network transfer
const encoded = Encode(logMessage, 100)
// encoded is an object that can be serialized with JSON.stringify()
// Example: { method: 'log', data: [...], timestamp: '...' }

// 3. Simulate network transfer (convert to JSON)
const jsonString = JSON.stringify(encoded)
// Can be stored in localStorage or sent over network

// 4. Parse JSON on receiving side
const received = JSON.parse(jsonString)

// 5. Decode: Deserialize to restore original form
const decoded = Decode(received)
// decoded is a complete log object of type Message
// { method: 'log', data: [...], timestamp: '...' }

// 6. Pass to Console component
<Console logs={[decoded]} variant="dark" />
```

**Real-world Usage Scenario:**

```tsx
// Send log to server
const sendLogToServer = (log: Message) => {
  const encoded = Encode(log, 100)
  fetch('/api/logs', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(encoded), // Can be safely serialized
  })
}

// Display logs received from server
const receiveLogFromServer = async () => {
  const response = await fetch('/api/logs')
  const encodedLogs = await response.json()

  const decodedLogs = encodedLogs.map((encoded: any) => Decode(encoded))
  setLogs(decodedLogs)
}
```

## Capturing Logs from iframe

You can display console methods like `console.log()`, `console.error()` executed inside an iframe in the main window's console-feed.

**Simple Method:**

After the iframe loads, hook the iframe's `contentWindow.console`.

```tsx
import React, { useState, useEffect, useRef } from 'react'
import { Console, Hook, Decode, Unhook } from '@cp949/console-feed'
import type { Message } from '@cp949/console-feed/src/definitions/Component'
import type { HookedConsole } from '@cp949/console-feed/src/definitions/Console'

const IframeLogsContainer = () => {
  const [logs, setLogs] = useState<Message[]>([])
  const iframeRef = useRef<HTMLIFrameElement | null>(null)

  useEffect(() => {
    const iframe = iframeRef.current
    if (!iframe) return

    let hookedConsole: HookedConsole | null = null

    // Wait for iframe to load
    const handleLoad = () => {
      if (!iframe.contentWindow) {
        console.error('iframe contentWindow is not available')
        return
      }

      // Hook iframe's console
      const iframeConsole = iframe.contentWindow.console
      hookedConsole = Hook(
        iframeConsole,
        (encoded, message) => {
          // encode is true, so use Decode to decode the log (required!)
          const decoded = Decode(encoded)
          const logMessage: Message = {
            ...decoded,
            id: `log-${Date.now()}-${Math.random()}`,
            data: decoded.data || [],
          }
          setLogs((prevLogs) => [...prevLogs, logMessage])
        },
        true, // encode: true
        100, // limit: 100
      )
    }

    iframe.addEventListener('load', handleLoad)

    // Cleanup: Clean up when component unmounts
    return () => {
      if (hookedConsole && iframe.contentWindow) {
        Unhook(hookedConsole)
      }
      iframe.removeEventListener('load', handleLoad)
    }
  }, [])

  return (
    <div>
      <iframe ref={iframeRef} src="./your-iframe.html" />
      <Console logs={logs} variant="dark" />
    </div>
  )
}
```

**Notes:**

- Console must be hooked after the iframe loads (`load` event)
- The iframe and main window must be same-origin to access `contentWindow.console`
- Must call `Unhook` when the component unmounts to clean up

## Development

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

### React 18/19 Compatibility Testing

```bash
# Test both React 18 and 19
pnpm test:compat

# Test React 18 only
pnpm test:react18

# Test React 19 only
pnpm test:react19
```

Script: `packages/console-feed/scripts/test-react-compat.sh`

## Release

Only the library package (`@cp949/console-feed`) is published to npm.

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

## Security

- `pnpm audit`: 0 vulnerabilities
- Tests: 28/28 passing

Resolved vulnerabilities:

- @babel/runtime (Moderate, 2 issues): removed via react-inspector 9.0.0 upgrade
- Jest dependencies (22 issues): eliminated via Vitest 4.0.10 migration

Security mechanisms:

- Prototype pollution defense
- DOM sanitization (isomorphic-dompurify)
- Serialization depth limits
- Input filtering

Verification scripts:

```bash
# Run from packages/console-feed directory
cd packages/console-feed
./scripts/security-test.sh
./scripts/verify-all.sh
```

**Note**: The above scripts are from the original repository and may not be used in the current project.

## License

MIT

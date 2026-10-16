# console-feed

[한국어](README.ko.md) | English

A React component that captures browser console output and displays it in the UI. Supports React 18 and 19.

This is a fork of [samdenty/console-feed](https://github.com/samdenty/console-feed) v3.6.0 with security vulnerability fixes.

## Installation

```sh
npm install @cp949/console-feed
```

Package info: https://www.npmjs.com/package/@cp949/console-feed

## Import Paths

The package root keeps the existing public API for compatibility:

```tsx
import { Console, Hook, Decode, Unhook } from '@cp949/console-feed'
import type { Message, HookedConsole, Methods } from '@cp949/console-feed'
```

Non-UI utilities can also be imported from stable subpaths:

```tsx
import Hook from '@cp949/console-feed/hook'
import Unhook from '@cp949/console-feed/unhook'
import { Decode, Encode } from '@cp949/console-feed/transform'
```

## Chrome 75 Library Artifacts

The library artifacts target Chrome 75. The package does not inject global polyfills. Consumers do not need to install `core-js`.

For the verification commands and the recorded smoke test result, see the [repository README](https://github.com/cp949/console-feed/blob/master/README.md#chrome-75-library-artifacts).

## Features

- Styled console entries (color substitution, clickable links)
- Renders DOM nodes, tables, and other console methods
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
import type { Message } from '@cp949/console-feed'

const LogsContainer = () => {
  const [logs, setLogs] = useState<Message[]>([])

  useEffect(() => {
    const hookedConsole = Hook(
      window.console,
      (encoded, message) => {
        // encode is true, so encoded is a serialized message: Decode is required
        // If encode were false, encoded would already be parsed: do not call Decode
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
- `logFilter?`: Log filtering function - Replaces the default regex filter. Applied only when `searchKeywords` is set
- `logGrouping?`: Enable log grouping (default: `true`) - Merge consecutive identical logs and show the count in `amount`
- `linkifyOptions?`: linkifyjs options object - URL link handling options
- `components?`: Component override object - Replace the default components with custom ones

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

Restores a console wrapped by Hook to its original state. Call it when the component unmounts.

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

- Converts a log object into a JSON-serializable form
- Safely converts functions, circular references, DOM nodes, etc.
- `limit`: Serialization depth limit (default: 100)
- **Return Value**: A value that `JSON.stringify()` can serialize
  - Complex types (functions, DOM nodes, `Map`, etc.) become objects with type markers
  - Its structure is internal. Pass it to `Decode` instead of reading it directly
  - Suitable for network transfer, localStorage storage, etc.

**Decode:**

- Restores a serialized log to a `Message` object
- Returns a complete log object including the `method` property
- **Important**: Pass only `Encode` output to `Decode`.
  - When `encode` is `true`: The first argument (`encoded`) of the callback is a serialized message, so call `Decode`
  - When `encode` is `false`: The first argument (`encoded`) is already a parsed message. Do not call `Decode`; it throws a `TypeError`

**Usage Example:**

```tsx
import { Encode, Decode } from '@cp949/console-feed'

// 1. Create log message
const logMessage = {
  method: 'log' as const,
  data: [
    'Hello World',
    { name: 'console-feed', version: '1.0.0' },
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

Logs from `console.log()`, `console.error()`, and other console methods inside an iframe can be shown in the console-feed of the parent window.

**Simple Method:**

After the iframe loads, hook the iframe's `contentWindow.console`.

```tsx
import React, { useState, useEffect, useRef } from 'react'
import { Console, Hook, Decode, Unhook } from '@cp949/console-feed'
import type { Message, HookedConsole } from '@cp949/console-feed'

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
          // encode is true, so Decode is required
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

    // Cleanup: Unhook when component unmounts
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
- Call `Unhook` when the component unmounts

## Development

For setup, tests, and the release process, see the [repository README](https://github.com/cp949/console-feed/blob/master/README.md).

## License

MIT

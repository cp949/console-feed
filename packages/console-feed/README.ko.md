# console-feed

한국어 | [English](README.md)

브라우저 콘솔 출력을 캡처하여 사용자 인터페이스에 렌더링하는 React 컴포넌트입니다. React 18과 19를 지원합니다.

이 패키지는 [samdenty/console-feed](https://github.com/samdenty/console-feed) v3.6.0을 포크하여 보안 취약점을 수정한 버전입니다.

## 설치

```sh
npm install @cp949/console-feed
```

패키지 정보: https://www.npmjs.com/package/@cp949/console-feed

## Import 경로

패키지 루트는 호환성을 위해 기존 공개 API를 그대로 제공합니다:

```tsx
import { Console, Hook, Decode, Unhook } from '@cp949/console-feed'
import type { Message, HookedConsole, Methods } from '@cp949/console-feed'
```

UI 없이 쓰는 유틸리티는 별도 경로(subpath)로도 import할 수 있습니다:

```tsx
import Hook from '@cp949/console-feed/hook'
import Unhook from '@cp949/console-feed/unhook'
import { Decode, Encode } from '@cp949/console-feed/transform'
```

## Chrome 75 라이브러리 산출물

라이브러리 산출물은 Chrome 75를 대상으로 합니다. 패키지는 전역 polyfill을 주입하지 않습니다. 사용하는 쪽에서 `core-js`를 설치할 필요도 없습니다.

검증 명령과 기록된 smoke 테스트 결과는 [저장소 README](https://github.com/cp949/console-feed/blob/master/README.ko.md#chrome-75-라이브러리-산출물)를 참조하세요.

## 기능

- 스타일링된 콘솔 항목 (컬러 치환, 클릭 가능한 링크)
- DOM 노드, 테이블, 다양한 콘솔 메서드 렌더링
- 직렬화 (함수, 순환 구조, DOM 참조 변환)
- 필터링 및 검색
- 에러 스택 트레이스 표시
- 성능 측정 (`console.time`/`timeEnd` 지원)
- 다크/라이트 테마 지원

## 기본 사용법

함수 컴포넌트 (Hooks):

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
        // encode가 true이므로 encoded는 직렬화된 메시지: Decode 필수
        // encode가 false였다면 encoded는 이미 파싱된 메시지: Decode를 호출하지 않음
        const decoded = Decode(encoded)
        const logMessage: Message = {
          ...decoded,
          id: `log-${Date.now()}-${Math.random()}`,
          data: decoded.data || [],
        }
        setLogs((prevLogs) => [...prevLogs, logMessage])
      },
      true, // encode: true - 네트워크 전송을 위한 직렬화
      100, // limit: 100 - 직렬화 깊이 제한
    )

    // Cleanup: 컴포넌트 언마운트 시 Unhook
    return () => {
      Unhook(hookedConsole)
    }
  }, [])

  return <Console logs={logs} variant="dark" />
}
```

## API

### Console 컴포넌트

로그 메시지를 표시하는 React 컴포넌트입니다.

**Props:**

- `logs`: 로그 메시지 배열 (`Message[]`) - **필수**
- `variant?`: 테마 (`"dark"` | `"light"`, 기본값: `"dark"`)
- `styles?`: 커스텀 스타일 객체
- `filter?`: 메서드 필터 배열 (`Methods[]`) - 지정된 메서드만 표시
- `searchKeywords?`: 검색 키워드 문자열 - 로그 내용에서 정규식 검색
- `logFilter?`: 로그 필터링 함수 - 기본 정규식 필터를 대체합니다. `searchKeywords`가 있을 때만 적용됩니다
- `logGrouping?`: 로그 그룹화 활성화 여부 (기본값: `true`) - 연속된 동일 로그를 하나로 합치고 횟수를 `amount`에 표시
- `linkifyOptions?`: linkifyjs 옵션 객체 - URL 링크 처리 옵션
- `components?`: 컴포넌트 오버라이드 객체 - 커스텀 컴포넌트로 교체

### Hook 함수

`window.console` 또는 콘솔과 유사한 객체를 감싸서 로그를 캡처합니다.

```tsx
Hook(
  console: Console,
  callback: (encoded: Message, message: Payload) => void,
  encode?: boolean,  // 기본값: true
  limit?: number     // 기본값: 100 (직렬화 깊이 제한)
): HookedConsole
```

**매개변수:**

- `console`: 훅을 걸 Console 객체
- `callback`: 로그가 캡처될 때 호출되는 콜백 함수
  - `encoded`: 로그 메시지 (첫 번째 인자)
    - `encode`가 `true`인 경우: 직렬화된 메시지 (네트워크 전송/저장에 적합)
    - `encode`가 `false`인 경우: 파싱된 메시지 (직렬화되지 않음, 같은 메모리 공간에서 사용)
  - `message`: 파싱된 메시지 (두 번째 인자, 항상 직렬화되지 않은 파싱 결과)
- `encode`: 로그를 직렬화할지 여부 (기본값: `true`)
  - `true`: 파싱된 메시지를 직렬화하여 네트워크 전송이나 localStorage 저장에 적합한 형태로 변환
  - `false`: 파싱된 메시지를 직렬화하지 않고 그대로 사용 (같은 메모리 공간에서 사용할 때 더 효율적)
- `limit`: 직렬화 깊이 제한 (기본값: `100`, `encode`가 `true`일 때만 적용)

**반환값:**

- `HookedConsole`: 훅이 걸린 Console 객체 (Unhook에 전달 가능)

### Unhook 함수

Hook으로 감싼 콘솔을 원래 상태로 복원합니다. 컴포넌트가 언마운트될 때 호출하세요.

```tsx
Unhook(hookedConsole: HookedConsole): boolean
```

**매개변수:**

- `hookedConsole`: Hook으로 감싼 Console 객체

**반환값:**

- `boolean`: 성공 여부 (`true`: 성공, `false`: 실패)

### Encode / Decode 함수

네트워크 경계를 넘어 로그를 전송할 때 사용합니다.

```tsx
Encode<T>(data: any, limit?: number): T
Decode(data: any): Message
```

**Encode:**

- 로그 객체를 JSON으로 직렬화할 수 있는 형태로 변환합니다
- 함수, 순환 참조, DOM 노드 등을 안전하게 변환합니다
- `limit`: 직렬화 깊이 제한 (기본값: 100)
- **반환값**: `JSON.stringify()`로 직렬화할 수 있는 값
  - 복잡한 타입(함수, DOM 노드, `Map` 등)은 타입 마커가 붙은 객체로 바뀝니다
  - 내부 구조는 공개 규격이 아닙니다. 직접 읽지 말고 `Decode`에 전달하세요
  - 네트워크 전송, localStorage 저장 등에 적합합니다

**Decode:**

- 직렬화된 로그를 `Message` 객체로 복원합니다
- `method` 속성을 포함한 완전한 로그 객체를 반환합니다
- **중요**: `Decode`에는 `Encode`의 출력만 전달하세요.
  - `encode`가 `true`인 경우: callback의 첫 번째 인자(`encoded`)는 직렬화된 메시지이므로 `Decode`를 호출해야 합니다
  - `encode`가 `false`인 경우: 첫 번째 인자(`encoded`)는 이미 파싱된 메시지입니다. `Decode`를 호출하지 마세요. `TypeError`가 발생합니다

**사용 예제:**

```tsx
import { Encode, Decode } from '@cp949/console-feed'

// 1. 로그 메시지 생성
const logMessage = {
  method: 'log' as const,
  data: [
    'Hello World',
    { name: 'console-feed', version: '1.0.0' },
    [1, 2, 3],
  ],
  timestamp: new Date().toISOString(),
}

// 2. Encode: 네트워크 전송을 위해 직렬화
const encoded = Encode(logMessage, 100)
// encoded는 JSON.stringify()로 직렬화 가능한 객체입니다
// 예: { method: 'log', data: [...], timestamp: '...' }

// 3. 네트워크 전송 시뮬레이션 (JSON으로 변환)
const jsonString = JSON.stringify(encoded)
// localStorage에 저장하거나 네트워크로 전송 가능

// 4. 수신 측에서 JSON 파싱
const received = JSON.parse(jsonString)

// 5. Decode: 역직렬화하여 원본 형태로 복원
const decoded = Decode(received)
// decoded는 Message 타입의 완전한 로그 객체입니다
// { method: 'log', data: [...], timestamp: '...' }

// 6. Console 컴포넌트에 전달
<Console logs={[decoded]} variant="dark" />
```

**실제 사용 시나리오:**

```tsx
// 서버로 로그 전송
const sendLogToServer = (log: Message) => {
  const encoded = Encode(log, 100)
  fetch('/api/logs', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(encoded), // 안전하게 직렬화 가능
  })
}

// 서버에서 받은 로그 표시
const receiveLogFromServer = async () => {
  const response = await fetch('/api/logs')
  const encodedLogs = await response.json()

  const decodedLogs = encodedLogs.map((encoded: any) => Decode(encoded))
  setLogs(decodedLogs)
}
```

## iframe에서 로그 캡처하기

iframe 안에서 실행한 `console.log()`, `console.error()` 등의 로그를 부모 윈도우의 console-feed에 표시할 수 있습니다.

**간단한 방법:**

iframe이 로드된 뒤 iframe의 `contentWindow.console`에 훅을 걸면 됩니다.

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

    // iframe 로드 완료 대기
    const handleLoad = () => {
      if (!iframe.contentWindow) {
        console.error('iframe contentWindow is not available')
        return
      }

      // iframe의 console에 훅을 걸기
      const iframeConsole = iframe.contentWindow.console
      hookedConsole = Hook(
        iframeConsole,
        (encoded, message) => {
          // encode가 true이므로 Decode 필수
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

    // Cleanup: 컴포넌트 언마운트 시 Unhook
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

**주의사항:**

- iframe이 로드된 뒤(`load` 이벤트)에 console에 훅을 걸어야 합니다
- iframe과 메인 윈도우가 같은 origin이어야 `contentWindow.console`에 접근할 수 있습니다
- 컴포넌트가 언마운트될 때 `Unhook`을 호출하세요

## 개발

개발 환경 설정, 테스트, 릴리스 절차는 [저장소 README](https://github.com/cp949/console-feed/blob/master/README.ko.md)를 참조하세요.

## 라이선스

MIT

# console-feed

한국어 | [English](README.md)

브라우저 콘솔 출력을 캡처하여 사용자 인터페이스에 렌더링하는 React 컴포넌트입니다. React 18과 19를 지원합니다.

[samdenty/console-feed](https://github.com/samdenty/console-feed) v3.6.0을 포크하여 보안 취약점을 수정한 버전입니다.

## 설치

```sh
npm install @cp949/console-feed
```

패키지 정보: https://www.npmjs.com/package/@cp949/console-feed

## 변경사항

### 보안 취약점 수정

- react-inspector 9.0.0 업그레이드: @babel/runtime 취약점 제거
- Jest → Vitest 4.0.10 마이그레이션: 22개 의존성 체인 취약점 해결
- Prototype pollution 방어: `__proto__`, `constructor`, `prototype` 키 필터링
- DOM 정화: isomorphic-dompurify 적용
- 직렬화 깊이 제한 추가

### 의존성 업데이트

- TypeScript 5.9.3
- React 18, 19 지원
- Node 20+ 기준
- Vitest 4.0.10

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
import type { Message } from '@cp949/console-feed/src/definitions/Component'

const LogsContainer = () => {
  const [logs, setLogs] = useState<Message[]>([])

  useEffect(() => {
    const hookedConsole = Hook(
      window.console,
      (encoded, message) => {
        // encode가 true인 경우: encoded는 직렬화된 메시지이므로 Decode 필수
        // encode가 false인 경우: encoded는 파싱된 메시지이지만 Decode를 사용하면 안전
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

    // Cleanup: 컴포넌트 언마운트 시 Hook 해제
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
- `logFilter?`: 로그 필터링 함수 - `searchKeywords`와 함께 사용 시 커스텀 필터링 로직
- `logGrouping?`: 로그 그룹화 활성화 여부 (기본값: `true`) - 동일한 로그를 그룹화하여 `amount`로 표시
- `linkifyOptions?`: linkifyjs 옵션 객체 - URL 링크 처리 옵션
- `components?`: 컴포넌트 오버라이드 객체 - 커스텀 컴포넌트로 교체

### Hook 함수

`window.console` 또는 콘솔과 유사한 객체를 래핑하여 로그를 캡처합니다.

```tsx
Hook(
  console: Console,
  callback: (encoded: Message, message: Payload) => void,
  encode?: boolean,  // 기본값: true
  limit?: number     // 기본값: 100 (직렬화 깊이 제한)
): HookedConsole
```

**매개변수:**

- `console`: Hook할 Console 객체
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

- `HookedConsole`: Hook된 Console 객체 (Unhook에 전달 가능)

### Unhook 함수

Hook으로 래핑된 콘솔을 원래 상태로 복원합니다. 컴포넌트 언마운트 시 반드시 호출해야 합니다.

```tsx
Unhook(hookedConsole: HookedConsole): boolean
```

**매개변수:**

- `hookedConsole`: Hook으로 래핑된 Console 객체

**반환값:**

- `boolean`: 성공 여부 (`true`: 성공, `false`: 실패)

### Encode / Decode 함수

네트워크 경계를 넘어 로그를 전송할 때 사용합니다.

```tsx
Encode<T>(data: any, limit?: number): T
Decode(data: any): Message
```

**Encode:**

- 로그 객체를 JSON으로 직렬화 가능한 형태로 변환합니다
- 함수, 순환 참조, DOM 노드 등을 안전하게 변환합니다
- `limit`: 직렬화 깊이 제한 (기본값: 100)
- **반환값**: JSON으로 직렬화 가능한 평면적인 객체 구조
  - 원본 객체의 복잡한 타입(함수, DOM 노드 등)은 특별한 타입 마커와 함께 변환됩니다
  - `JSON.stringify()`로 안전하게 직렬화할 수 있습니다
  - 네트워크 전송, localStorage 저장 등에 적합합니다

**Decode:**

- 직렬화된 로그를 역직렬화하여 `Message` 객체로 변환합니다
- `method` 속성을 포함한 완전한 로그 객체를 반환합니다
- **중요**:
  - `encode`가 `true`인 경우: callback의 첫 번째 인자(`encoded`)는 직렬화된 메시지이므로 반드시 `Decode`를 호출해야 합니다
  - `encode`가 `false`인 경우: callback의 첫 번째 인자(`encoded`)는 이미 파싱된 메시지이지만, 안전하게 사용하려면 `Decode`를 호출하는 것을 권장합니다

**사용 예제:**

```tsx
import { Encode, Decode } from '@cp949/console-feed'

// 1. 로그 메시지 생성
const logMessage = {
  method: 'log' as const,
  data: [
    'Hello World',
    { name: 'console-feed', version: '3.6.5' },
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

iframe 내부에서 실행되는 `console.log()`, `console.error()` 등의 콘솔 메서드를 메인 윈도우의 console-feed에 표시할 수 있습니다.

**간단한 방법:**

iframe이 로드된 후, iframe의 `contentWindow.console`을 Hook하면 됩니다.

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

    // iframe 로드 완료 대기
    const handleLoad = () => {
      if (!iframe.contentWindow) {
        console.error('iframe contentWindow is not available')
        return
      }

      // iframe의 console을 Hook
      const iframeConsole = iframe.contentWindow.console
      hookedConsole = Hook(
        iframeConsole,
        (encoded, message) => {
          // encode가 true이므로 Decode를 사용하여 로그를 디코딩 (필수!)
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

    // Cleanup: 컴포넌트 언마운트 시 정리
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

- iframe이 로드된 후(`load` 이벤트)에 console을 Hook해야 합니다
- iframe과 메인 윈도우가 같은 origin이어야 `contentWindow.console`에 접근할 수 있습니다
- 컴포넌트 언마운트 시 반드시 `Unhook`을 호출하여 정리해야 합니다

## 개발

### 프로젝트 구조

```
console-feed/
├── apps/
│   └── demo/              # 데모 앱 (Vite + React)
├── packages/
│   └── console-feed/      # 라이브러리 코어
├── turbo.json             # Turborepo 설정
├── pnpm-workspace.yaml    # pnpm workspace 설정
└── package.json           # 루트 workspace
```

### 개발 환경 요구사항

- Node 20+
- pnpm 9+

### 개발 명령어

```bash
# 의존성 설치
pnpm install

# 전체 워크스페이스 개발 서버 실행
pnpm dev

# 전체 워크스페이스 빌드
pnpm build

# 전체 워크스페이스 테스트
pnpm test

# 특정 패키지만 실행
pnpm --filter @cp949/console-feed build    # 라이브러리 빌드
pnpm --filter demo dev                      # 데모 앱만 실행
pnpm --filter @cp949/console-feed test     # 라이브러리 테스트
```

### React 18/19 호환성 테스트

```bash
# React 18과 19 모두 테스트
pnpm test:compat

# React 18만 테스트
pnpm test:react18

# React 19만 테스트
pnpm test:react19
```

스크립트: `packages/console-feed/scripts/test-react-compat.sh`

## 릴리스

라이브러리 패키지(`@cp949/console-feed`)만 npm에 배포됩니다.

```bash
# 1. 전체 테스트 및 빌드 검증
pnpm test
pnpm build

# 2. packages/console-feed 디렉토리로 이동
cd packages/console-feed

# 3. 버전 업데이트
pnpm version patch  # 또는 minor, major

# 4. 변경사항 커밋 및 푸시
git add .
git commit -m "Release vX.X.X"
git push

# 5. npm에 배포
pnpm publish
```

## 보안

- `pnpm audit`: 취약점 0개
- 테스트: 28/28 통과

해결된 취약점:

- @babel/runtime (중간, 2건): react-inspector 9.0.0 업그레이드로 제거
- Jest 의존성 (22건): Vitest 4.0.10 마이그레이션으로 제거

보안 메커니즘:

- Prototype pollution 방어
- DOM 정화 (isomorphic-dompurify)
- 직렬화 깊이 제한
- 입력 필터링

검증 스크립트:

```bash
# packages/console-feed 디렉토리에서 실행
cd packages/console-feed
./scripts/security-test.sh
./scripts/verify-all.sh
```

**참고**: 위 스크립트들은 원본 저장소에서 가져온 것으로, 현재 프로젝트에서는 사용하지 않을 수 있습니다.

## 라이선스

MIT

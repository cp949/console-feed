# console-feed

브라우저 콘솔 출력을 캡처하여 사용자 인터페이스에 렌더링하는 React 컴포넌트입니다. React 18+ 앱에서 작동하며 브라우저 및 서버 환경에서 사용할 수 있도록 sanitized 처리되어 있습니다.

이 저장소는 [samdenty/console-feed](https://github.com/samdenty/console-feed) v3.6.0을 포크하여 보안 개선 및 의존성을 최신 버전으로 적용한 버전입니다.

## 설치

```sh
pnpm add @cp949/console-feed
# 또는
yarn add @cp949/console-feed
# 또는
npm install @cp949/console-feed
```

패키지 정보: https://www.npmjs.com/package/@cp949/console-feed

## 원본 저장소 대비 변경사항

### 보안 개선
- react-inspector 9.0.0 업그레이드로 @babel/runtime 취약점 제거
- Jest → Vitest 4.0.10 마이그레이션으로 테스트 의존성 보안 취약점 근본 해결
- Prototype pollution 방어 메커니즘 추가 (`__proto__`, `constructor`, `prototype` 키 차단)
- isomorphic-dompurify를 통한 DOM purification 적용
- 직렬화 깊이 제한으로 DoS 공격 방어

### 의존성 최신 버전 적용
- TypeScript 5.9.3 적용 (컴파일 타겟: ES3 → ES6)
- React 18+ 지원 (React Native 미지원)
- Node 20+ 기준
- Jest → Vitest 4.0.10으로 마이그레이션 (빠른 테스트 실행, 깨끗한 의존성 트리)

### 기타 개선사항
- `linkify-html`/`linkify-react`를 통한 링크 처리 개선
- `@emotion/react` 기반 테마 시스템
- `@cp949` 스코프 패키지로 재배포

## 기능

- 컬러 치환 및 클릭 가능한 링크를 지원하는 스타일링된 콘솔 항목
- DOM 노드, 테이블, 다양한 콘솔 메서드(`log`, `warn`, `debug`, `table` 등) 렌더링
- 함수, 순환 구조, DOM 참조를 안전하게 변환하는 직렬화 기능
- 필터링, 검색, 로그 그룹화 기능

## 기본 사용법

클래스 컴포넌트:

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

함수 컴포넌트 (Hooks):

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

### Console 컴포넌트

Props:
- `logs`: 로그 메시지 배열
- `filter`: 로그 필터링 함수
- `searchKeywords`: 검색 키워드
- `linkifyOptions`: 링크 처리 옵션
- `variant`: 테마 (`"dark"` | `"light"`)

### Hook 함수

`window.console` 또는 콘솔과 유사한 객체를 래핑하여 로그를 캡처합니다. `Encode`로 항목을 직렬화하여 콜백으로 전달합니다.

```tsx
Hook(
  console: Console,
  callback: (log: EncodedLog) => void,
  encode?: boolean
): HookedConsole
```

### Unhook 함수

Hook으로 래핑된 콘솔을 원래 상태로 복원합니다.

```tsx
Unhook(hookedConsole: HookedConsole): void
```

### Encode / Decode 함수

네트워크 경계를 넘어 로그를 전송할 때 사용합니다.

```tsx
Encode<T>(data: any, limit?: number): T
Decode(data: any): Message
```

## 개발

Node 20 이상에서 의존성을 설치해야 합니다.

```bash
pnpm install
pnpm start          # 개발 서버 실행
pnpm test           # 테스트 실행 (Vitest)
pnpm test:watch     # 테스트 watch 모드
pnpm test:ui        # Vitest UI
pnpm build          # 프로덕션 빌드
```

빌드는 TypeScript 컴파일(`tsc -p tsconfig.build.json --declaration`)을 실행하고 선언 파일을 `lib/` 디렉토리에 복사합니다.

## 릴리스

1. Node 20에서 `pnpm test` 및 `pnpm build` 실행하여 검증
2. `pnpm version patch/minor/major`로 버전 업데이트
3. 변경사항을 커밋하고 브랜치 푸시
4. `pnpm publish`로 npm 레지스트리에 게시

스코프 패키지는 `publishConfig`를 통해 기본적으로 public 액세스로 설정되어 있습니다.

## 보안

### 현재 상태 (2025-11-18)

`pnpm audit` 결과: 0 vulnerabilities

주요 의존성 버전:
- TypeScript 5.9.3
- Vitest 4.0.10
- react-inspector 9.0.0

모든 테스트 통과 (28/28)

### 해결된 취약점

1. @babel/runtime 취약점 (Moderate, 2건)
   - 조치: react-inspector 9.0.0 업그레이드로 의존성 제거
   - 결과: react-inspector 9.x는 @babel/runtime을 사용하지 않음

2. Jest 관련 취약점 (brace-expansion, glob, minimatch - 총 22건)
   - 원인: Jest → babel-plugin-istanbul → test-exclude 의존성 체인
   - 조치: Jest → Vitest 4.0.10 마이그레이션으로 근본 해결
   - 결과: 깨끗한 의존성 트리, yarn resolutions 불필요, 더 빠른 테스트 실행

### 적용된 보안 메커니즘

- Prototype pollution 방어: `__proto__`, `constructor`, `prototype` 키 접근 차단
- DOM purification: isomorphic-dompurify를 통한 XSS 방어
- Encode 제한: 직렬화 깊이 제한으로 DoS 방어
- Sanitized 파싱: 로그 파싱 시 악의적 입력 필터링

### 보안 검증

검증 스크립트를 통해 자동화된 보안 검사를 수행할 수 있습니다:

```bash
./scripts/security-test.sh    # 보안 테스트 실행
./scripts/verify-all.sh        # 통합 검증 (테스트, 빌드, 보안 검사)
```

### 패키지 관리

pnpm을 사용하여 의존성을 관리합니다. pnpm의 엄격한 의존성 관리 정책으로 phantom dependency 문제를 방지하고, 디스크 공간을 효율적으로 사용합니다.

Vitest 4.0.10은 깨끗한 의존성 트리를 가지고 있어 별도의 resolutions가 필요하지 않습니다. 모든 간접 의존성이 최신 안전 버전을 사용합니다.

## 라이선스

원본 저장소의 라이선스를 따릅니다.

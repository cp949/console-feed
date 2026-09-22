# console-feed Monorepo

한국어 | [English](README.md)

이 저장소는 `@cp949/console-feed` 라이브러리와 관련 개발 도구들을 관리하는 monorepo입니다.

## 개요

`console-feed`는 브라우저 콘솔 출력을 캡처하여 React 컴포넌트로 표시하는 라이브러리입니다. React 18과 19를 모두 지원합니다.

이 저장소는 [samdenty/console-feed](https://github.com/samdenty/console-feed) v3.6.0을 포크하여 보안 취약점을 수정한 버전입니다.

## 프로젝트 구조

```
console-feed/
├── apps/
│   └── demo/              # 데모 애플리케이션 (Vite + React)
├── packages/
│   └── console-feed/      # 라이브러리 코어 (@cp949/console-feed)
├── scripts/               # 공통 스크립트
├── turbo.json             # Turborepo 설정
├── pnpm-workspace.yaml    # pnpm workspace 설정
└── package.json           # 루트 workspace 설정
```

### 패키지

- **`@cp949/console-feed`**: 메인 라이브러리 패키지
  - npm: [@cp949/console-feed](https://www.npmjs.com/package/@cp949/console-feed)
  - 상세 문서: [packages/console-feed/README.ko.md](packages/console-feed/README.ko.md)

- **`apps/demo`**: 데모 애플리케이션
  - 라이브러리 사용 예제 제공
  - 다양한 사용 시나리오 시연
  - 개발 중 라이브러리 테스트용

## 빠른 시작

### 라이브러리 사용자

패키지 설치:

```bash
npm install @cp949/console-feed
```

패키지 root는 기존 public API를 유지합니다. UI가 필요 없는 유틸리티는 안정적인 subpath에서도 사용할 수 있습니다:

```tsx
import { Console, Hook, Decode, Unhook } from '@cp949/console-feed'
import HookOnly from '@cp949/console-feed/hook'
import { Decode as DecodeOnly } from '@cp949/console-feed/transform'
```

사용 방법은 [패키지 README](packages/console-feed/README.ko.md)를 참조하세요.

### 개발자

**요구사항:**

- Node `^22.18.0` (CI 기준)
- pnpm `11.27.1`

**설정:**

```bash
# 의존성 설치
pnpm install
```

**개발 명령어:**

```bash
# 데모 앱 실행 (http://localhost:3000)
pnpm dev

# 모든 패키지 빌드
pnpm build

# 모든 테스트 실행
pnpm test

# 코드 린팅
pnpm lint
pnpm lint:fix

# 코드 포맷팅
pnpm format
pnpm format:check

# 특정 패키지만 실행
pnpm --filter @cp949/console-feed build    # 라이브러리 빌드
pnpm --filter demo dev                      # 데모만 실행
pnpm --filter @cp949/console-feed test     # 라이브러리 테스트
```

**React 호환성 테스트:**

```bash
# React 18과 19 모두 테스트
pnpm test:compat

# React 18만 테스트
pnpm test:react18

# React 19만 테스트
pnpm test:react19
```

### Chrome 75 라이브러리 산출물

라이브러리 산출물은 Chrome 75를 대상으로 합니다. 패키지는 전역 polyfill을 주입하지 않으며 소비자에게 `core-js` 설치를 요구하지 않습니다.

`pnpm --filter @cp949/console-feed check:chrome75`는 빌드한 패키지 산출물을 정적으로 검사합니다. `node fixtures/chrome75-consumer/scripts/build-packed.mjs`는 독립 소비자에서 설치형 tarball을 검사합니다. Linux Docker에서 실제 브라우저 smoke를 실행하려면 다음 명령을 사용합니다.

```bash
bash scripts/test-chrome75.sh
```

기록된 정확한 smoke는 Linux Docker와 Node 24에서 Chromium/HeadlessChrome `75.0.3770.90`으로 실행했습니다. 설치형 소비자는 캡처·decode·render·복원·스타일 검사를 모두 완료했고 fixture/CDP 오류가 없었습니다. historical image는 HTTPS로 snapshot을 내려받고 고정 Chromium deb SHA-1을 검증하며, `trusted=yes`는 이 snapshot source에만 적용합니다. Podman과 Node 22 실행 증거는 없습니다. 이 smoke는 fixture의 계산 스타일 검사 항목만 확인하며, 그 밖의 전반적인 CSS 동작, 다른 브라우저 엔진, 다른 운영체제는 검증하지 않았습니다.

## 개발 스택

- **빌드 시스템**: Turborepo
- **패키지 관리**: pnpm workspace
- **언어**: TypeScript ^6.0.3
- **테스트**: Vitest ^5.0.1
- **코드 품질**: ESLint와 Prettier
- **React 지원**: 18, 19

## 주요 변경사항 (원본 대비)

### 보안 취약점 수정

- react-inspector 9.0.0 업그레이드: @babel/runtime 취약점 제거
- Jest → Vitest 마이그레이션: 22개 의존성 체인 취약점 해결
- Prototype pollution 방어: `__proto__`, `constructor`, `prototype` 키 필터링
- DOM 정화: 서버 DOM 의존성 없이 DOMPurify 적용
- 직렬화 깊이 제한 추가

### 개발 환경 개선

- Turborepo 도입으로 빌드/테스트 파이프라인 최적화
- pnpm workspace로 의존성 관리 효율화
- ESLint와 Prettier 기반 lint/format 워크플로우
- React 18/19 호환성 자동 테스트

## 릴리스 프로세스

라이브러리 패키지(`@cp949/console-feed`)만 npm에 배포됩니다. 데모 앱은 `private: true`로 설정되어 있습니다.

배포는 항상 사람이 시작합니다. 에이전트나 CI에서는 이 명령을 실행하지 마세요. 배포 전 `packages/console-feed/CHANGELOG.md`를 갱신·커밋해야 합니다. `release-it`은 깨끗한 작업 트리를 요구합니다.

```bash
# 저장소 최상위에서 대화형 배포 절차를 시작합니다.
pnpm release-it
```

이 절차는 `packages/console-feed/package.json`만 버전 변경하고, 패키지의 `prepublishOnly`(`build`, `test`, `test:dist`)를 실행한 뒤 npm에 배포합니다. 이어서 릴리스 커밋, `v<version>` 태그, 푸시를 각각 대화형으로 확인합니다. 프롬프트에서 버전을 선택하고 각 외부 작업을 직접 승인하세요.

## 기여

이슈 및 풀 리퀘스트는 환영합니다. 기여 전에 다음을 확인해주세요:

1. 코드 스타일: `pnpm lint` 및 `pnpm format` 실행
2. 테스트: `pnpm test` 통과 확인
3. 빌드: `pnpm build` 성공 확인

## 라이선스

원본 저장소의 라이선스(MIT)를 따릅니다.

## 링크

- **원본 저장소**: [samdenty/console-feed](https://github.com/samdenty/console-feed)
- **패키지 문서**: [packages/console-feed/README.ko.md](packages/console-feed/README.ko.md)
- **npm 패키지**: [@cp949/console-feed](https://www.npmjs.com/package/@cp949/console-feed)
- **이슈**: [GitHub Issues](https://github.com/cp949/console-feed/issues)

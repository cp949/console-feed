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

사용 방법은 [패키지 README](packages/console-feed/README.ko.md)를 참조하세요.

### 개발자

**요구사항:**

- Node 20+
- pnpm 9+

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

## 개발 스택

- **빌드 시스템**: Turborepo
- **패키지 관리**: pnpm workspace
- **언어**: TypeScript 5.9.3
- **테스트**: Vitest 4.0.10
- **코드 품질**: ESLint 9, Prettier
- **React 지원**: 18, 19

## 주요 변경사항 (원본 대비)

### 보안 취약점 수정

- react-inspector 9.0.0 업그레이드: @babel/runtime 취약점 제거
- Jest → Vitest 4.0.10 마이그레이션: 22개 의존성 체인 취약점 해결
- Prototype pollution 방어: `__proto__`, `constructor`, `prototype` 키 필터링
- DOM 정화: isomorphic-dompurify 적용
- 직렬화 깊이 제한 추가

### 개발 환경 개선

- Turborepo 도입으로 빌드/테스트 파이프라인 최적화
- pnpm workspace로 의존성 관리 효율화
- ESLint 9 Flat Config 마이그레이션
- React 18/19 호환성 자동 테스트

## 보안 상태

- `pnpm audit`: 취약점 0개
- 테스트: 28/28 통과

해결된 취약점:

- @babel/runtime (중간, 2건): react-inspector 9.0.0 업그레이드로 제거
- Jest 의존성 (22건): Vitest 4.0.10 마이그레이션으로 제거

## 릴리스 프로세스

라이브러리 패키지(`@cp949/console-feed`)만 npm에 배포됩니다. 데모 앱은 `private: true`로 설정되어 있습니다.

```bash
# 1. 테스트 및 빌드 검증
pnpm test
pnpm build

# 2. 패키지 디렉토리로 이동
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

# console-feed

한국어 | [English](README.md)

브라우저 콘솔 출력을 캡처하여 사용자 인터페이스에 표시하는 React 컴포넌트입니다. React 18+ 앱에서 작동하며 브라우저 및 서버 환경에서 안전하게 사용할 수 있습니다.

## 이 포크에 대하여

이 저장소는 [samdenty/console-feed](https://github.com/samdenty/console-feed) v3.6.0을 포크하여 보안 개선 및 의존성 업데이트를 적용한 버전입니다.

### 왜 이 포크인가?

- **보안 최우선**: 원본 저장소의 24개 보안 취약점 제거
- **최신 스택**: 모든 의존성을 최신 안정 버전으로 업데이트
- **개선된 아키텍처**: Turborepo 모노레포 구조로 재구성하여 깨끗한 의존성 관리
- **프로덕션 준비**: 취약점 0개, 포괄적인 테스트 커버리지, 최적화된 빌드 파이프라인

## 주요 개선사항

### 보안 강화
- ✅ react-inspector 9.0.0 업그레이드 (@babel/runtime 취약점 제거)
- ✅ Jest → Vitest 4.0.10 마이그레이션 (22개 의존성 체인 취약점 해결)
- ✅ Prototype pollution 방어 추가 (`__proto__`, `constructor`, `prototype` 키 필터링)
- ✅ isomorphic-dompurify를 통한 DOM 정화 구현
- ✅ DoS 공격 방지를 위한 직렬화 깊이 제한 추가

### 최신 개발 스택
- **TypeScript 5.9.3**: ES6 컴파일 타겟
- **Vitest 4.0.10**: 빠른 테스트와 깨끗한 의존성 트리
- **Turborepo**: 지능형 캐싱으로 최적화된 모노레포 빌드
- **pnpm workspace**: Phantom dependency 방지를 위한 엄격한 의존성 관리

### 프로젝트 구조
```
console-feed/
├── apps/
│   └── demo/              # 데모 애플리케이션 (Vite + React)
├── packages/
│   └── console-feed/      # 라이브러리 코어
├── turbo.json             # Turborepo 설정
├── pnpm-workspace.yaml    # pnpm workspace 설정
└── package.json           # 루트 workspace
```

## 패키지 정보

- **npm 패키지**: [@cp949/console-feed](https://www.npmjs.com/package/@cp949/console-feed)
- **GitHub**: [cp949/console-feed](https://github.com/cp949/console-feed)

## 빠른 시작

### 라이브러리 사용자

패키지 설치:
```bash
pnpm add @cp949/console-feed
# 또는
yarn add @cp949/console-feed
# 또는
npm install @cp949/console-feed
```

사용 방법은 [패키지 README](packages/console-feed/README.md)를 참조하세요.

### 기여자/개발자

**요구사항:**
- Node 20+
- pnpm 9+

**개발 명령어:**
```bash
# 의존성 설치
pnpm install

# 데모 앱 실행
pnpm dev

# 모든 패키지 빌드
pnpm build

# 모든 테스트 실행
pnpm test

# 특정 패키지 실행
pnpm --filter @cp949/console-feed build    # 라이브러리 빌드
pnpm --filter demo dev                      # 데모만 실행
pnpm --filter @cp949/console-feed test     # 라이브러리 테스트
```

## 보안 상태

**현재 상태 (2025-11-18)**
- ✅ `pnpm audit`: 취약점 0개
- ✅ 모든 테스트 통과: 28/28
- ✅ TypeScript 5.9.3
- ✅ Vitest 4.0.10
- ✅ react-inspector 9.0.0

**해결된 취약점:**
1. **@babel/runtime** (중간, 2건) - react-inspector 9.0.0 업그레이드로 제거
2. **Jest 의존성** (22건) - Vitest 4.0.10 마이그레이션으로 제거

## 릴리스 프로세스

라이브러리 패키지(`@cp949/console-feed`)만 npm에 배포됩니다. 데모 앱은 `private: true`로 설정되어 있습니다.

```bash
# 1. 테스트 및 빌드 검증
pnpm test
pnpm build

# 2. 패키지로 이동
cd packages/console-feed

# 3. 버전 업데이트
pnpm version patch  # 또는 minor, major

# 4. 커밋 및 푸시
git add .
git commit -m "Release vX.X.X"
git push

# 5. npm에 배포
pnpm publish
```

## 아키텍처 이점

**Turborepo + pnpm workspace**:
- 라이브러리와 데모 의존성의 명확한 분리
- 지능형 빌드 캐싱 (변경되지 않은 패키지 스킵)
- Turborepo를 통한 30-50% 빠른 빌드 시간

**pnpm 장점**:
- 엄격한 의존성 해석으로 phantom dependency 방지
- 하드링크 기반 저장소로 효율적인 디스크 사용
- Turborepo와 최적화된 통합

## 라이선스

원본 저장소의 라이선스(MIT)를 따릅니다.

## 링크

- **원본 저장소**: [samdenty/console-feed](https://github.com/samdenty/console-feed)
- **패키지 문서**: [packages/console-feed/README.md](packages/console-feed/README.md)
- **이슈**: [GitHub Issues](https://github.com/cp949/console-feed/issues)

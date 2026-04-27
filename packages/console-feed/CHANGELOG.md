# Changelog

이 프로젝트의 주요 변경사항을 이 파일에 기록합니다.

형식은 [Keep a Changelog](https://keepachangelog.com/ko/1.1.0/)를 따르며,
이 프로젝트는 [Semantic Versioning](https://semver.org/lang/ko/)을 준수합니다.

## [Unreleased]

## [3.7.1] - 2026-04-28

3.7.0 publish 직후 발견된 검증 도구 결함과 문서 stale 상태를 정정하는 패치 릴리스. 라이브러리 코드(`dist/`)는 3.7.0과 동일.

### Added

- `packages/console-feed`에서 직접 `pnpm test:compat` / `pnpm test:react18` / `pnpm test:react19` 실행 가능. 기존엔 루트 `package.json`에만 정의되어 패키지 디렉토리에서 실행 시 `Command not found`로 실패했음.

### Fixed

- `pnpm test:compat`의 React 18 매트릭스가 모든 컴포넌트 테스트에서 "Objects are not valid as a React child" 에러로 실패하던 문제 수정. 원인: monorepo 안의 `apps/demo`(React 19 핀)가 `@emotion/*`·`react-inspector`를 자체 dependencies로 갖고 있어 pnpm이 이들을 React 19 단일 인스턴스로 hoist시키는 상태에서, swap 시 React만 18로 갈아치우면 emotion/react-inspector의 peer 매칭은 React 19에 묶인 채 잔존 → 다중 React 인스턴스. 수정: swap 명령에서 `@emotion/react`·`@emotion/styled`·`react-inspector`도 함께 dev install로 add해 React 18 매칭 별도 인스턴스가 만들어지도록 강제 (`scripts/test-react-compat.sh`, `.github/workflows/react-compat.yml`). **라이브러리 사용자에게는 영향 없음 — 검증 도구만 fix**.

### Changed

- README / README.ko 의 "Changes / 변경사항" 섹션 갱신 — 3.7.0 핵심 변경(emotion peerDeps 이전, TypeScript strict 모드 활성화, react-inline-center 제거)을 명시. 기존 항목 헤더에 시점 표시(3.6.8 / 이전), 의존성 섹션은 "현재 스택 / Current Stack"으로 헤더 변경.

## [3.7.0] - 2026-04-28

> ⚠️ **Breaking 가능성 있음**
>
> - `@emotion/react`, `@emotion/styled`, `react-inspector`가 `peerDependencies`로 이전되었습니다. 소비처는 이 패키지들을 명시적으로 설치해야 합니다.
> - TypeScript `strict` 모드 도입 영향으로 `HookedConsole.feed`가 옵셔널 프로퍼티(`feed?`)로 표기됩니다. `.d.ts` 시그니처 변경이며 런타임 동작은 동일하지만, 소비처가 strict 모드로 컴파일하면서 `console.feed`에 직접 접근하는 경우 옵셔널 가드가 필요할 수 있습니다.

### Changed

- `@emotion/react`, `@emotion/styled`, `react-inspector`를 `dependencies`에서 `peerDependencies`로 이전. 소비처가 해당 의존성의 버전을 직접 제어하고 중복 설치를 방지할 수 있도록 함.
- TypeScript `strict` 모드 활성화. `tsconfig.json`의 개별 옵션을 모두 제거하고 `"strict": true` 한 줄로 통합. 위반의 대부분(60건 이상)은 명시 타입·옵셔널 체이닝·옵셔널 프로퍼티 표기로 정리. 유일한 런타임 인접 변경은 `Transform/replicator/index.ts`의 catch 핸들러(`new Error(e)` → `new Error(String(e))`) — `Error` 생성자가 내부적으로 ToString을 호출하므로 동작은 사실상 동일.
- README / README.ko 의 "Security" 섹션에서 모순된 검증 스크립트 안내를 제거하고 실제 동작하는 `pnpm test` / `pnpm test:dist` / `pnpm audit` 안내로 대체.
- `package-exports.spec.js` → `package-exports.spec.ts` 확장자 통일. `require()` 대신 JSON 모듈 import 사용 (`moduleResolution: bundler` 활용).

### Removed

- `react-inline-center` 의존 제거. `Message.tsx`의 단일 사용처를 인라인 flex 스타일(`display: flex; alignItems: center; justifyContent: center`)로 대체.
- 루트 `package.json`의 `pnpm.overrides.yaml` 제거. `pnpm why yaml` 결과 의존 트리에 `yaml` 자체가 존재하지 않아 override가 무의미.
- 좀비 `scripts/security-test.sh` / `scripts/verify-all.sh` 삭제. yarn + 사라진 `lib/` 디렉토리 전제로 작성되어 현 환경에서 동작 불가. 검증은 워크스페이스 스크립트로 일원화.

### Migration

기존 사용자는 다음 의존성을 직접 설치해야 합니다.

```bash
pnpm add @emotion/react @emotion/styled react-inspector
# 또는
npm install @emotion/react @emotion/styled react-inspector
```

## [3.6.8] - 2026-04

### Added

- `tsup` 기반의 ESM + CJS 듀얼 빌드 도입 (기존 `tsc` CJS 단일 빌드 대체).
- `exports` map의 root 및 모든 공개 subpath (`./component`, `./hook`, `./unhook`, `./transform`)에 `import` / `require` 조건 분기 추가.
- default 전용 subpath (`./hook`, `./unhook`, `./component`)는 CJS/ESM 양쪽에서 함수 자체로 풀리도록 산출 — Next/Webpack 환경에서 `Hook`이 `{ default: fn }`으로 들어오던 interop 문제 해소.
- CJS/ESM dist shape 회귀 가드 (`verify-dist-shapes.mjs` + `pnpm --filter @cp949/console-feed test:dist`).
- `package.json`의 `repository.directory` 필드.
- `sideEffects: false` 표시로 번들러 tree-shaking 신호 강화.

### Changed

- DTS 생성을 별도 `tsconfig.dts.json`로 분리, 빌드 tsconfig 정리.
- `publish:npm` / turbo `outputs` / vitest `exclude` 정합성 정리.

## [3.6.7]

- 직전 배포된 안정 버전. 자세한 이력은 git log를 참조하세요.

[Unreleased]: https://github.com/cp949/console-feed/compare/v3.7.1...HEAD
[3.7.1]: https://github.com/cp949/console-feed/compare/v3.7.0...v3.7.1
[3.7.0]: https://github.com/cp949/console-feed/compare/v3.6.8...v3.7.0
[3.6.8]: https://github.com/cp949/console-feed/compare/v3.6.7...v3.6.8
[3.6.7]: https://github.com/cp949/console-feed/releases/tag/v3.6.7

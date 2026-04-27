# Changelog

이 프로젝트의 주요 변경사항을 이 파일에 기록합니다.

형식은 [Keep a Changelog](https://keepachangelog.com/ko/1.1.0/)를 따르며,
이 프로젝트는 [Semantic Versioning](https://semver.org/lang/ko/)을 준수합니다.

## [Unreleased]

## [3.7.0] - 2026-04-27

> ⚠️ **Breaking 가능성 있음** — `@emotion/react`, `@emotion/styled`, `react-inspector`가 `peerDependencies`로 이전되었습니다. 소비처는 이 패키지들을 명시적으로 설치해야 합니다.

### Changed

- `@emotion/react`, `@emotion/styled`, `react-inspector`를 `dependencies`에서 `peerDependencies`로 이전. 소비처가 해당 의존성의 버전을 직접 제어하고 중복 설치를 방지할 수 있도록 함.

### Removed

- `react-inline-center` 의존 제거. `Message.tsx`의 단일 사용처를 인라인 flex 스타일(`display: flex; alignItems: center; justifyContent: center`)로 대체.

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

[Unreleased]: https://github.com/cp949/console-feed/compare/v3.7.0...HEAD
[3.7.0]: https://github.com/cp949/console-feed/compare/v3.6.8...v3.7.0
[3.6.8]: https://github.com/cp949/console-feed/compare/v3.6.7...v3.6.8
[3.6.7]: https://github.com/cp949/console-feed/releases/tag/v3.6.7

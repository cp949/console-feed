# S-003: vite 계열 업데이트

## 취약점 정보

- 패키지: `vite`, `rollup`, `flatted`, `picomatch`
- 심각도: high, moderate
- 현재 핵심 버전: `vite 7.2.6`
- 권장 패치 버전: `vite 7.3.2` 이상, `rollup 4.59.0` 이상, `flatted 3.4.2` 이상, `picomatch 4.0.4` 이상

## 취약점 요약

- Vite dev server 파일 노출 관련 취약점 3건
- Rollup path traversal 1건
- `@vitest/ui` 경로의 `flatted` 취약점 2건
- Vite 경로의 `picomatch` 취약점 2건

## 의존성 경로

- `apps__demo > vite`
- `apps__demo > vite > rollup`
- `packages__console-feed > @vitest/ui > flatted`
- `apps__demo > vite > picomatch`

## 수정 계획

- `apps/demo/package.json`의 `vite`를 패치 포함 최신 호환 버전으로 상향
- `apps/demo/package.json`의 `@vitejs/plugin-react`도 peer 범위에 맞춰 함께 상향
- 재설치 후 남는 전이 의존성은 추가 조정 여부 검토

## 수정 내용

- `apps/demo/package.json`
  - `vite`: `^7.2.6` -> `^8.0.9`
  - `@vitejs/plugin-react`: `^5.1.1` -> `^6.0.1`
- `packages/console-feed/package.json`
  - `vitest`: `^4.0.15` -> `^4.1.4`
  - `@vitest/ui`: `^4.0.15` -> `^4.1.4`

## 부가 수정

- `packages/console-feed/src/Hook/__tests__/console.ts`
  - Vitest 4 환경에서 테스트용 콘솔 객체가 `undefined`로 들어오던 회귀를 해결하기 위해 ambient `console` 참조 대신 `globalThis.console`를 명시적으로 사용하도록 수정

## 검증 결과

- `pnpm --filter @cp949/console-feed test` 결과 28개 테스트 통과
- `pnpm build` 결과 demo 포함 전체 빌드 성공
- `pnpm audit --json` 재실행 후 `vite`, `rollup`, `flatted`, `picomatch` 관련 advisory 제거 확인

## 진행 상태

- 상태: 완료

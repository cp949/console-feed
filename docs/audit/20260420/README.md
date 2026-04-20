# pnpm audit 보안 취약점 분석 - 2026년 4월 20일

## 개요

- 감사 일시: 2026-04-20
- 실행 명령: `pnpm audit --json`
- 초기 취약점: 17건
- 초기 심각도별 집계: high 7 / moderate 10
- 최종 취약점: 0건

## 현재 취약점 묶음

| 번호 | 패키지 | 심각도 | 유형 | 현재 상태 | 문서 |
|------|--------|--------|------|-----------|------|
| S-001 | `lodash` | high + moderate | 직접 의존성 업데이트 | 완료 | [S-001](./S-001-lodash-update.md) |
| S-002 | `isomorphic-dompurify` / `dompurify` | high + moderate | 직접 의존성 업데이트 | 완료 | [S-002](./S-002-dompurify-update.md) |
| S-003 | `vite` 계열 (`vite`, `rollup`, `flatted`, `picomatch`) | high + moderate | 직접 의존성 업데이트 + 전이 의존성 정리 | 완료 | [S-003](./S-003-vite-update.md) |
| S-004 | `yaml` | moderate | 전이 의존성 잔여 여부 확인 | 완료 | [S-004](./S-004-yaml-review.md) |

## 초기 분석

- `packages/console-feed/package.json`의 `lodash@^4.17.21`가 직접 취약점 대상이다.
- `packages/console-feed/package.json`의 `isomorphic-dompurify@^2.33.0`가 내부적으로 취약한 `dompurify@3.3.0`을 설치한다.
- `apps/demo/package.json`의 `vite@^7.2.6`가 현재 `vite`, `rollup`, `picomatch` 관련 취약점을 포함한다.
- `packages/console-feed`의 `@vitest/ui` 체인에서 `flatted` 취약점이 보고된다.
- `@emotion/react -> @emotion/babel-plugin -> babel-plugin-macros -> cosmiconfig -> yaml` 경로에 `yaml` 취약점이 보고된다.

## 해결 전략

### 전략 1: 직접 의존성 우선 업데이트

- `lodash`, `isomorphic-dompurify`, `vite`, `@vitejs/plugin-react`를 우선 최신 호환 범위로 상향한다.
- 직접 업데이트만으로 전이 의존성이 함께 정리되면 override는 추가하지 않는다.

### 전략 2: 재감사 후 잔여 전이 의존성만 최소 개입

- 1차 업데이트 후 `pnpm audit --json`를 다시 실행한다.
- 잔여 항목이 있으면 실제 설치 경로를 확인한 뒤 `pnpm.overrides` 또는 상위 패키지 추가 업데이트 여부를 결정한다.

### 전략 3: 각 수정 단위별 기록 유지

- 각 S-문서에 취약점 정보, 의존성 경로, 수정 방법, 검증 결과를 순서대로 남긴다.
- 최종적으로 README 표의 상태를 완료 또는 수동 검토로 업데이트한다.

## 최종 검증

- `pnpm audit --json` 결과: 취약점 0건
- `pnpm --filter @cp949/console-feed test` 결과: 28개 테스트 통과
- `pnpm build` 결과: 라이브러리 빌드 및 demo 빌드 성공
- 참고: `demo` 빌드 시 `ErrorStackTraceExample.tsx`의 직접 `eval` 사용 경고는 기존 예제 코드에 대한 경고이며 빌드는 성공했다.

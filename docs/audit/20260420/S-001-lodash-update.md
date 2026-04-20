# S-001: lodash 업데이트

## 취약점 정보

- 패키지: `lodash`
- 심각도: high, moderate
- 현재 버전: `4.17.21`
- 권장 패치 버전: `4.18.0` 이상

## 취약점 요약

- `_.template`의 `options.imports` 키 이름 검증 누락으로 인한 코드 주입
- `_.unset`, `_.omit`의 배열 경로 우회로 인한 prototype pollution

## 의존성 경로

- `packages__console-feed > lodash`

## 수정 계획

- `packages/console-feed/package.json`의 `lodash`를 안전 버전으로 상향
- 설치 후 `pnpm audit --json` 재실행으로 해당 advisory 제거 여부 확인

## 수정 내용

- `packages/console-feed/package.json`
  - `lodash`: `^4.17.21` -> `^4.18.1`

## 검증 결과

- `pnpm audit --json` 재실행 후 `lodash` 관련 advisory 제거 확인
- 최종 검증에서 전체 취약점 0건 확인

## 진행 상태

- 상태: 완료

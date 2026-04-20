# S-002: isomorphic-dompurify / dompurify 업데이트

## 취약점 정보

- 패키지: `isomorphic-dompurify`, `dompurify`
- 심각도: high, moderate
- 현재 설치 핵심 버전: `isomorphic-dompurify 2.33.0`, `dompurify 3.3.0`
- 권장 패치 버전: `dompurify 3.4.0` 이상

## 취약점 요약

- 여러 DOMPurify 우회 및 XSS 관련 advisory
- `ADD_TAGS`, `ADD_ATTR`, `USE_PROFILES`, rawtext element 처리 경로 관련 취약점 다수 포함

## 의존성 경로

- `packages__console-feed > isomorphic-dompurify > dompurify`

## 수정 계획

- `packages/console-feed/package.json`의 `isomorphic-dompurify`를 최신 안정 버전으로 상향
- 내부 `dompurify`가 패치 버전으로 올라오는지 lockfile과 `pnpm audit --json`로 확인

## 수정 내용

- `packages/console-feed/package.json`
  - `isomorphic-dompurify`: `^2.33.0` -> `^3.9.0`
- lockfile 기준 내부 `dompurify`가 `3.4.0`으로 상향됨

## 검증 결과

- `pnpm audit --json` 재실행 후 `dompurify` 관련 advisory 5건 제거 확인
- 최종 검증에서 전체 취약점 0건 확인

## 진행 상태

- 상태: 완료

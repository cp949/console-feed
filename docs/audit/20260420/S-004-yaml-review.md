# S-004: yaml 전이 의존성 검토

## 취약점 정보

- 패키지: `yaml`
- 심각도: moderate
- 권장 패치 버전: `1.10.3` 이상

## 의존성 경로

- `packages__console-feed > @emotion/react > @emotion/babel-plugin > babel-plugin-macros > cosmiconfig > yaml`

## 검토 계획

- 직접 의존성 업데이트 이후에도 이 항목이 남는지 확인
- 남는 경우 상위 패키지 업데이트 또는 `pnpm.overrides` 필요 여부 판단

## 검토 결과

- `@emotion/react -> @emotion/babel-plugin -> babel-plugin-macros -> cosmiconfig@7` 경로는 최신 상위 패키지 조합에서도 `yaml 1.x`를 유지한다.
- 상위 패키지 업그레이드만으로는 `yaml 1.10.3` 반영이 불가능해 루트 override가 필요했다.

## 수정 내용

- 루트 `package.json`
  - `pnpm.overrides.yaml = "1.10.3"` 추가
- 기존 `node_modules`에 남아 있던 `yaml@1.10.2` 잔재가 `audit` 결과에 영향을 줘, `node_modules` 정리 후 재설치 수행

## 검증 결과

- 재설치 후 `find node_modules -path '*yaml@1.10.2*'` 결과 없음 확인
- `pnpm audit --json` 결과 취약점 0건 확인

## 진행 상태

- 상태: 완료

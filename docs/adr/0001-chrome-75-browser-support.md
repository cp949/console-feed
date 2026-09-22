---
status: accepted
---

# Chrome 75를 `@cp949/console-feed`의 브라우저 하한으로 지원한다

`@cp949/console-feed`는 Chrome 75에서 사용할 수 있는 배포 패키지를 제공한다. 이 결정에서 Chrome 75는 라이브러리의 브라우저 하한이다. React 18·19 peer 범위, Node와 pnpm의 개발 도구 버전, Safari·Firefox·모바일 WebView 지원 범위는 별개의 계약으로 취급한다.

이전에는 최신 브라우저에서의 단위 테스트와 빌드 성공만으로 구형 브라우저 호환성을 판단할 여지가 있었다. 하지만 배포 산출물의 문법, 외부 의존성이 최종 번들에 남기는 코드, 런타임 API, Emotion이 적용하는 실제 스타일은 서로 다른 시점과 위치에서 실패할 수 있다. 따라서 지원 대상을 선언하는 것과 실제 실행 증거를 남기는 일을 함께 한다.

## 책임 경계

Chrome 75 호환성은 라이브러리 하나가 단독으로 해결할 수 있는 문제가 아니다. 배포 패키지와 소비자 애플리케이션이 맡는 범위를 다음처럼 나눈다.

| 구분 | 책임 | 수단 |
| --- | --- | --- |
| 라이브러리 배포 산출물의 문법 | 라이브러리 | `tsdown`을 `chrome75` 대상으로 빌드한다. |
| 라이브러리 산출물의 ES·Web API 사용 | 라이브러리 | `check:chrome75`가 빌드된 모든 JS 산출물을 ES2019 기준과 알려진 미지원 API 목록으로 검사한다. |
| 외부 의존성의 문법 | 소비자 | 최종 번들러를 `chrome75` 대상으로 설정한다. |
| 외부 의존성의 런타임 API | 소비자 | 소비자 애플리케이션의 호환성 정책에 따라 관리한다. |
| 실제 화면의 CSS와 동작 | 라이브러리와 소비자 | 설치형 소비자를 정확한 Chrome 75에서 실행해 확인한다. |

라이브러리 진입점은 `core-js` 같은 전역 polyfill을 불러오지 않으며, 소비자에게 설치를 요구하지 않는다. 전역 객체와 polyfill 정책은 애플리케이션의 소유이므로, 라이브러리가 이를 묵시적으로 변경하면 다른 의존성 및 호스트 정책과 충돌할 수 있다.

## 검증 기준

정적 검사와 실제 브라우저 실행은 대체 관계가 아니다. 각 검증은 다른 종류의 회귀를 막는다.

| 검증 | 증명하는 범위 | 증명하지 않는 범위 |
| --- | --- | --- |
| `pnpm --filter @cp949/console-feed check:chrome75` | `dist`의 JS 산출물이 존재하며, Chrome 75에 맞지 않는 문법과 검사 대상 API가 없는지 | 실제 브라우저에서의 렌더링, 외부 의존성의 최종 번들 결과 |
| `node fixtures/chrome75-consumer/scripts/build-packed.mjs` | `npm pack` 결과를 설치한 독립 소비자가 빌드되는지 | 정확한 Chrome 75에서의 실행 |
| `bash scripts/test-chrome75.sh` | Linux Docker의 Chromium `75.0.3770.90`에서 설치형 소비자의 캡처, decode, 렌더, console 복원, 핵심 계산 스타일이 동작하는지 | 다른 운영체제·브라우저 엔진의 동작, 전반적인 CSS 호환성 |

정확한 브라우저 smoke는 고정된 Chromium 버전을 사용하고, CDP로 fixture의 완료 상태와 오류를 수집한다. fixture는 `Hook`으로 로그를 캡처하고 `Decode`한 결과를 `Console`에 렌더한 뒤, `Unhook` 이후 원래 console 메서드가 복원됐는지 확인한다. 렌더된 로그의 텍스트와 핵심 계산 스타일도 함께 확인한다.

`check:chrome75`는 CI에서 패키지 빌드 직후 실행한다. 정확한 Chrome 75 smoke는 릴리스 전, 또는 빌드 도구·React·의존성·스타일 계층을 바꾸는 작업 뒤에 다시 실행할 수 있는 수동 검증으로 유지한다. 검증 대상을 찾지 못하거나 fixture가 완료 신호를 내지 못하면 성공으로 처리하지 않는다.

## 결과와 유지 원칙

- 공개 진입점과 ESM·CJS 배포 형식은 유지한다. Chrome 75 지원을 이유로 API 표면이나 소비자 애플리케이션의 전역 정책을 바꾸지 않는다.
- `apps/demo`는 로컬 소스 alias를 사용할 수 있으므로, 배포 패키지 증거는 독립 설치형 fixture가 맡는다.
- Chrome 75 smoke의 통과 기록은 해당 컨테이너, 해당 Chromium 버전, 해당 fixture에 대한 실행 증거다. Safari, Firefox, 모바일 WebView, Docker Desktop, Podman, 다른 Node 버전 또는 모든 CSS 동작까지 자동으로 확장하지 않는다.
- 미지원 API를 새로 도입하거나 번들 도구·외부 의존성을 갱신할 때는 정적 검사와 설치형 fixture를 먼저 확인하고, 변경 위험에 맞춰 정확한 Chrome 75 smoke를 다시 실행한다.
- 실행 명령은 README에 둔다. 지원 하한의 근거, 책임 경계, 검증 해석은 이 문서를 기준으로 한다.

## 관련 경로

- `packages/console-feed/tsdown.config.mts`
- `packages/console-feed/scripts/check-chrome75.mjs`
- `fixtures/chrome75-consumer/`
- `scripts/test-chrome75.sh`
- `docker/chrome75/Dockerfile`

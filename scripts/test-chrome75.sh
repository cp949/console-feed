#!/usr/bin/env bash
set -euo pipefail

# Linux에서 실행한다. 예: CONTAINER_RUNTIME=podman bash scripts/test-chrome75.sh
# CONTAINER_RUNTIME: docker 또는 podman 실행 파일 (기본 docker)
# CHROME75_IMAGE: 빌드할 이미지 이름 (기본 console-feed-chrome75)
# CHROME75_TIMEOUT_MS: CDP 준비부터 fixture 완료까지 제한 시간 (기본 30000)
# CHROME75_LOG_DIR: 빌드/CDP/브라우저 로그 저장 디렉터리 (기본 /tmp의 새 디렉터리)
# host network의 loopback으로만 CDP와 fixture에 접근한다. Docker Desktop은 대상 밖이다.
repo_root=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)
cd "$repo_root"
runtime=${CONTAINER_RUNTIME:-docker}
image=${CHROME75_IMAGE:-console-feed-chrome75}
log_dir=${CHROME75_LOG_DIR:-$(mktemp -d /tmp/console-feed-chrome75.XXXXXX)}
mkdir -p "$log_dir"
container_id=''

cleanup() {
  status=$?
  trap - EXIT
  if [[ -n "$container_id" ]]; then
    "$runtime" logs "$container_id" > "$log_dir/browser.log" 2>&1 || true
    "$runtime" stop --time 5 "$container_id" > /dev/null 2>&1 || true
    "$runtime" rm "$container_id" > /dev/null 2>&1 || true
  fi
  if (( status != 0 )); then
    [[ ! -f "$log_dir/browser.log" ]] || cat "$log_dir/browser.log" >&2
  fi
  echo "Chrome 75 로그: $log_dir"
  exit "$status"
}
trap cleanup EXIT
trap 'exit 130' INT
trap 'exit 143' TERM

command -v "$runtime" > /dev/null
node fixtures/chrome75-consumer/scripts/build-packed.mjs
"$runtime" build -t "$image" -f docker/chrome75/Dockerfile docker/chrome75 2>&1 | tee "$log_dir/build.log"
"$runtime" image inspect "$image" > "$log_dir/image.json"
"$runtime" run --rm --network=none "$image" --version | tee "$log_dir/version.log"
grep -E '^Chromium 75\.0\.3770\.90([[:space:]]|$)' "$log_dir/version.log"

cdp_port=$(node --input-type=module -e '
  import { createServer } from "node:net";
  const server = createServer();
  server.listen(0, "127.0.0.1", () => {
    console.log(server.address().port);
    server.close();
  });
')
# 별도 Chromium sandbox 대신 컨테이너의 비특권 사용자, read-only root,
# capability 제거, no-new-privileges, 일회용 /tmp 프로필을 사용한다.
container_id=$("$runtime" run -d --network=host --user 65534:65534 \
  --read-only --cap-drop=ALL --security-opt=no-new-privileges \
  --tmpfs /tmp:rw,nosuid,size=256m --shm-size=256m --env HOME=/tmp/chrome75-home \
  --entrypoint sh "$image" -c 'mkdir -p "$HOME/profile" && exec chromium "$@"' chromium \
  --headless --no-sandbox --disable-gpu \
  --disable-background-networking --disable-component-update --no-first-run \
  --no-default-browser-check --user-data-dir=/tmp/chrome75-home/profile \
  --remote-debugging-address=127.0.0.1 --remote-debugging-port="$cdp_port" about:blank)
CDP_ENDPOINT="http://127.0.0.1:$cdp_port" node scripts/chrome75-smoke.mjs 2>&1 | tee "$log_dir/result.log"

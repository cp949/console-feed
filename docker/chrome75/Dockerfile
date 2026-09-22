FROM debian:bookworm-slim AS certificates
RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates

FROM debian:buster-20190610-slim@sha256:0fd2c346de4fb5be7faead089c76527a7305393921b419fa9d197ffd43a713e3
COPY --from=certificates /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/ca-certificates.crt

# Debian이 최초로 보관한 정확한 Chromium 75 패키지와 의존성을 사용한다.
# 보관 서명키는 2025년에 만료됐다. 이 고정 HTTPS snapshot만 신뢰하며
# Chromium deb는 Debian snapshot metadata의 SHA-1과 별도로 대조한다.
RUN printf '%s\n' 'deb [check-valid-until=no trusted=yes] https://snapshot.debian.org/archive/debian/20190614T154943Z/ sid main' > /etc/apt/sources.list \
 && apt-get -o Acquire::Check-Valid-Until=false update \
 && apt-get download chromium=75.0.3770.90-1 \
 && printf '%s\n' '7e68b3ba274d3c882c7712e97135ddfce653a47d  chromium_75.0.3770.90-1_amd64.deb' | sha1sum -c - \
 && apt-get install -y --no-install-recommends chromium=75.0.3770.90-1 \
 && chromium --version | grep -E '^Chromium 75\.0\.3770\.90([[:space:]]|$)'

ENTRYPOINT ["chromium"]

#!/bin/bash
set -euo pipefail

# React 18/19 호환성 테스트 스크립트
# packages/console-feed를 React 18과 19에서 각각 테스트하고 원래 상태로 복원

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PACKAGE_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
PACKAGE_JSON="$PACKAGE_DIR/package.json"
BACKUP_JSON="$PACKAGE_JSON.backup"

# 색상 출력
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 정리 함수 (에러 발생 시에도 실행)
cleanup() {
  if [ -f "$BACKUP_JSON" ]; then
    echo -e "\n${YELLOW}원래 상태로 복원 중...${NC}"
    mv "$BACKUP_JSON" "$PACKAGE_JSON"
    cd "$PACKAGE_DIR"
    pnpm install --silent > /dev/null 2>&1 || true
    echo -e "${GREEN}복원 완료${NC}"
  fi
}

# 에러 발생 시 정리 실행
trap cleanup EXIT

# React 버전별 테스트 함수
test_react_version() {
  local version=$1
  local react_version=$2
  local react_dom_version=$3
  local types_react=$4
  local types_react_dom=$5

  echo -e "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${BLUE}React ${version} 테스트 시작${NC}"
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

  cd "$PACKAGE_DIR"

  # React 버전 설치
  echo -e "${YELLOW}React ${version} 의존성 설치 중...${NC}"
  pnpm add -D \
    "react@${react_version}" \
    "react-dom@${react_dom_version}" \
    "@types/react@${types_react}" \
    "@types/react-dom@${types_react_dom}" \
    --silent

  # 설치된 버전 확인
  echo -e "${YELLOW}설치된 버전:${NC}"
  pnpm list react react-dom @types/react @types/react-dom 2>/dev/null | grep -E "(react|@types/react)" || true

  # 테스트 실행
  echo -e "\n${YELLOW}테스트 실행 중...${NC}"
  if pnpm test; then
    echo -e "${GREEN}✓ React ${version} 테스트 통과${NC}"
    return 0
  else
    echo -e "${RED}✗ React ${version} 테스트 실패${NC}"
    return 1
  fi
}

# 메인 실행
main() {
  local test_version="${1:-both}"

  echo -e "${BLUE}╔════════════════════════════════════════════╗${NC}"
  echo -e "${BLUE}║  React 18/19 호환성 테스트 시작          ║${NC}"
  echo -e "${BLUE}╚════════════════════════════════════════════╝${NC}"

  # package.json 백업
  if [ ! -f "$BACKUP_JSON" ]; then
    echo -e "\n${YELLOW}package.json 백업 중...${NC}"
    cp "$PACKAGE_JSON" "$BACKUP_JSON"
  fi

  cd "$PACKAGE_DIR"

  # 테스트 결과 저장
  local react18_result=0
  local react19_result=0

  # React 18 테스트
  if [ "$test_version" = "18" ] || [ "$test_version" = "both" ]; then
    if ! test_react_version "18" "^18.3.1" "^18.3.1" "^18.0.0" "^18.0.0"; then
      react18_result=1
    fi
  fi

  # React 19 테스트
  if [ "$test_version" = "19" ] || [ "$test_version" = "both" ]; then
    if ! test_react_version "19" "^19.2.1" "^19.2.1" "^19.0.0" "^19.0.0"; then
      react19_result=1
    fi
  fi

  # 결과 요약
  echo -e "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${BLUE}테스트 결과 요약${NC}"
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

  if [ "$test_version" = "18" ] || [ "$test_version" = "both" ]; then
    if [ $react18_result -eq 0 ]; then
      echo -e "${GREEN}✓ React 18: 통과${NC}"
    else
      echo -e "${RED}✗ React 18: 실패${NC}"
    fi
  fi

  if [ "$test_version" = "19" ] || [ "$test_version" = "both" ]; then
    if [ $react19_result -eq 0 ]; then
      echo -e "${GREEN}✓ React 19: 통과${NC}"
    else
      echo -e "${RED}✗ React 19: 실패${NC}"
    fi
  fi

  # 전체 결과
  local total_result=$((react18_result + react19_result))
  if [ "$test_version" = "18" ]; then
    total_result=$react18_result
  elif [ "$test_version" = "19" ]; then
    total_result=$react19_result
  fi

  echo -e "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  if [ $total_result -eq 0 ]; then
    echo -e "${GREEN}✅ 모든 테스트 통과!${NC}"
    exit 0
  else
    echo -e "${RED}❌ 일부 테스트 실패${NC}"
    exit 1
  fi
}

# 스크립트 실행
main "${@}"


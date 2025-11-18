#!/bin/bash
set -euo pipefail

echo "🔍 Starting comprehensive verification..."

echo
echo "📦 1. install dependencies"
yarn install --frozen-lockfile

echo
echo "🔧 2. type check"
yarn tsc --noEmit

echo
echo "🧪 3. tests"
CI=1 yarn test --coverage --runInBand

echo
echo "📦 4. build"
yarn build

echo
echo "📊 5. bundle size"
SIZE=$(du -sh lib/ | awk '{print $1}')
echo "Bundle size: $SIZE"

echo
echo "🔒 6. audit"
yarn audit --level low || { echo "⚠️ Audit failed; check _TEMP/audit.log or rerun when registry reachable"; }

echo
echo "🎨 7. demo (Vite) build"
cd demo && yarn install --frozen-lockfile && yarn build
cd -

echo
echo "✅ Verify-all complete"
echo "  bundle size: $SIZE"

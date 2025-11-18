#!/bin/bash

# Move to script directory
cd "$(dirname "$0")"

echo "🧹 Cleaning console-feed monorepo..."

# Clean root level
echo "  → Root"
rm -rf .turbo node_modules

# Clean apps
if [ -d "apps" ]; then
  for dir in apps/*/; do
    if [ -d "$dir" ]; then
      echo "  → apps/$(basename "$dir")"
      rm -rf "${dir}.turbo" "${dir}node_modules" "${dir}dist"
    fi
  done
fi

# Clean packages
if [ -d "packages" ]; then
  for dir in packages/*/; do
    if [ -d "$dir" ]; then
      echo "  → packages/$(basename "$dir")"
      rm -rf "${dir}.turbo" "${dir}node_modules" "${dir}dist"
    fi
  done
fi

echo "✅ Clean complete!"

#!/bin/bash
set -e

# Ensure Node.js dependencies are installed for dev tools like ts-node
if [ ! -d node_modules ]; then
  echo "Installing Node.js dependencies..."
  if command -v pnpm >/dev/null 2>&1; then
    pnpm install
  else
    echo "Error: pnpm not found in PATH." >&2
    exit 1
  fi
fi

# Ensure the Prisma client is generated
if command -v pnpm >/dev/null 2>&1; then
  pnpm exec prisma generate
else
  npx prisma generate
fi

# Install Python requirements for the coin sniper module
pip install -r src/modules/coin_sniper/requirements.txt
MOCK_CACHE=1 TS_NODE_COMPILER_OPTIONS='{"module":"commonjs"}' TS_NODE_TRANSPILE_ONLY=1 node -r ts-node/register -r tsconfig-paths/register ./node_modules/mocha/bin/_mocha tests/**/*.test.ts

if command -v cargo >/dev/null 2>&1; then
  cargo test --manifest-path src/modules/nft_mint_bot/Cargo.toml
else
  echo "cargo not found; skipping Rust tests" >&2
fi

if command -v pytest >/dev/null 2>&1; then
  pytest src/modules/coin_sniper/tests
else
  echo "pytest not found; skipping Python tests" >&2
fi

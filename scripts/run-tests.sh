#!/bin/bash
set -e

# Ensure Node.js dependencies are installed for dev tools like ts-node
if [ ! -d node_modules ]; then
  echo "Installing npm dependencies..."
  npm ci
fi

# Install Python requirements for the coin sniper module
pip install -r src/modules/coin_sniper/requirements.txt
MOCK_CACHE=1 TS_NODE_COMPILER_OPTIONS='{"module":"commonjs"}' TS_NODE_TRANSPILE_ONLY=1 node -r ts-node/register -r tsconfig-paths/register ./node_modules/mocha/bin/_mocha tests/**/*.test.ts
cargo test --manifest-path src/modules/nft_mint_bot/Cargo.toml
pytest src/modules/coin_sniper/tests

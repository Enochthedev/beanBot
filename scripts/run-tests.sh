#!/bin/bash
set -e
MOCK_CACHE=1 TS_NODE_COMPILER_OPTIONS='{"module":"commonjs"}' node -r ts-node/register -r tsconfig-paths/register ./node_modules/mocha/bin/_mocha tests/**/*.test.ts
cargo test --manifest-path src/modules/nft_mint_bot/Cargo.toml
pytest src/modules/coin_sniper/tests

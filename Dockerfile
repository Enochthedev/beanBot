FROM node:18-bullseye

# Install Rust
RUN apt-get update && apt-get install -y curl build-essential && \
    curl https://sh.rustup.rs -sSf | bash -s -- -y && \
    /root/.cargo/bin/rustup default stable
ENV PATH="/root/.cargo/bin:${PATH}"

# Install pnpm
RUN npm install -g pnpm

WORKDIR /app
COPY . .
RUN pnpm install
RUN cargo build --release -p nft_mint_bot || true

CMD ["pnpm", "run", "dev"]

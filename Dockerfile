# syntax=docker/dockerfile:1
FROM node:24-slim

# Install system deps
RUN apt-get update && apt-get install -y --no-install-recommends \
    git \
    curl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package files first for layer cache
COPY package.json package-lock.json ./
COPY scripts/ ./scripts/

# Install deps
RUN npm ci --legacy-peer-deps

# Copy source (overridden by volume mount in dev)
COPY . .

# Ports:
# 8081 - Metro bundler
# 19000 - Expo classic
# 19001 - Expo dev tools
# 19002 - Expo web dashboard
EXPOSE 8081 19000 19001 19002

CMD ["npx", "expo", "start", "--host", "lan", "--port", "8081"]

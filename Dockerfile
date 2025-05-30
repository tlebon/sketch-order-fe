# ---- Build Stage ----
    FROM node:20-slim AS builder

    WORKDIR /app

    # Install pnpm
    RUN npm install -g pnpm

    # Copy package files
    COPY package.json pnpm-lock.yaml ./

    # Install dependencies
    RUN pnpm install

    # Copy source code
    COPY . .

    # Build the app
    RUN pnpm build
    CMD ["node", "build/index.js"]
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

    # ---- Production Stage ----
    FROM node:20-slim

    WORKDIR /app

    # Copy built app and dependencies
    COPY --from=builder /app/package.json ./
    COPY --from=builder /app/pnpm-lock.yaml ./
    COPY --from=builder /app/.svelte-kit /app/.svelte-kit
    COPY --from=builder /app/static /app/static

    # Install only production dependencies
    RUN npm install -g pnpm && pnpm install --prod

    # Set the port (change if needed)
    ENV PORT=5173
    EXPOSE 5173

    # Start the app (Node adapter)
    CMD ["node", ".svelte-kit/output/server/index.js"]
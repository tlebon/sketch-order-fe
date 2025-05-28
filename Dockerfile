FROM --platform=linux/amd64 node:20-slim as builder

WORKDIR /app

# Install build dependencies
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy the rest of the application
COPY . .

# Build the application
RUN pnpm build

# Production stage
FROM --platform=linux/amd64 node:20-slim

WORKDIR /app

# Install serve
RUN npm install -g serve

# Copy built files from builder
COPY --from=builder /app/build ./build
COPY --from=builder /app/package.json ./

# Expose the port
EXPOSE 5173

# Start the production server
ENV NODE_ENV=production
CMD ["serve", "-s", "build", "-l", "5173"]

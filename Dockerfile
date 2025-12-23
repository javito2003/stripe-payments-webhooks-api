# syntax=docker/dockerfile:1.7

############################
# 1) deps (cache friendly)
############################
FROM node:25-alpine AS deps
WORKDIR /app

# Install native build dependencies for bcrypt
RUN apk add --no-cache libc6-compat openssl python3 make g++

# pnpm via corepack with pinned version
RUN /usr/local/bin/corepack enable && /usr/local/bin/corepack prepare pnpm@10.24.0 --activate

# Copy only manifests to maximize cache
COPY package.json pnpm-lock.yaml ./

# Cache pnpm store (BuildKit)
RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store \
    pnpm config set store-dir /pnpm/store && \
    pnpm install --frozen-lockfile

############################
# 2) build
############################
FROM node:25-alpine AS build
WORKDIR /app

# Install native build dependencies
RUN apk add --no-cache libc6-compat openssl python3 make g++

# pnpm via corepack
RUN /usr/local/bin/corepack enable && /usr/local/bin/corepack prepare pnpm@10.24.0 --activate

# Bring installed node_modules
COPY --from=deps /app/node_modules ./node_modules
COPY package.json pnpm-lock.yaml ./

# Copy source code
COPY . .

# Build NestJS (outputs to dist/)
RUN pnpm build

# Prune dev dependencies for smaller runtime image
ENV CI=true
RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store \
    pnpm prune --prod

############################
# 3) runtime (small & safe)
############################
FROM node:25-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Install runtime dependencies (openssl for Stripe, bcrypt)
RUN apk add --no-cache openssl

# Create non-root user
RUN addgroup -S nodejs && adduser -S nestjs -G nodejs

# Copy only necessary files
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist

# Switch to non-root user
USER nestjs

EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s \
  CMD node -e "require('http').get('http://localhost:3000', (r) => r.statusCode === 200 ? process.exit(0) : process.exit(1))"

CMD ["node", "dist/main.js"]

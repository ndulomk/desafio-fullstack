# Stage 1: Dependencies
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install --legacy-peer-deps

# Stage 2: Build
FROM node:22-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# Stage 3: Production
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN apk add --no-cache dumb-init

# Copy built app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY package.json ./

# Copy source for migrations/seed (tsx needs ts files)
COPY --from=builder /app/src/db ./src/db
COPY --from=builder /app/src/shared ./src/shared
COPY --from=builder /app/src/config ./src/config
COPY --from=builder /app/src/modules ./src/modules
COPY --from=builder /app/tsconfig.json ./
COPY --from=builder /app/drizzle ./drizzle

EXPOSE 3000
USER node
CMD ["dumb-init", "node", "dist/main.js"]

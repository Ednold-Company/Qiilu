FROM node:22-alpine AS deps
WORKDIR /app
COPY backend/package.json backend/package-lock.json ./
COPY backend/prisma ./prisma
COPY backend/prisma.config.ts ./prisma.config.ts
ARG DATABASE_URL=postgresql://postgres:postgres@localhost:5432/qiilu?sslmode=disable
ENV DATABASE_URL=${DATABASE_URL}
RUN npm ci
RUN npx prisma generate

FROM node:22-alpine AS builder
WORKDIR /app
ARG DATABASE_URL=postgresql://postgres:postgres@localhost:5432/qiilu?sslmode=disable
ENV DATABASE_URL=${DATABASE_URL}
COPY --from=deps /app/node_modules ./node_modules
COPY backend/. .
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/package-lock.json ./package-lock.json
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts
EXPOSE 4000
CMD ["sh", "-c", "npx prisma db push && node dist/server.js"]

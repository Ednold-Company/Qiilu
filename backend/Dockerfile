FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
COPY prisma ./prisma
COPY prisma.config.ts ./prisma.config.ts
ARG DATABASE_URL=postgresql://postgres:postgres@localhost:5432/qiilu?sslmode=disable
ENV DATABASE_URL=${DATABASE_URL}
RUN npm install --include=dev --no-audit --no-fund
RUN npx prisma generate

FROM node:22-alpine AS builder
WORKDIR /app
ARG DATABASE_URL=postgresql://postgres:postgres@localhost:5432/qiilu?sslmode=disable
ENV DATABASE_URL=${DATABASE_URL}
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY package.json package-lock.json prisma.config.ts ./
EXPOSE 4000
CMD ["sh", "-c", "npx prisma db push && node dist/server.js"]

# ─────────────────────────────────────────────
# Stage 1: Install dependencies
# ─────────────────────────────────────────────
FROM node:24-alpine AS deps

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --frozen-lockfile

# ─────────────────────────────────────────────
# Stage 2: Build the Next.js app
# ─────────────────────────────────────────────
FROM node:24-alpine AS builder

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Env yang dibutuhkan saat build
ARG BACKEND_URL=https://api.altar.web.id
ENV BACKEND_URL=$BACKEND_URL

RUN npm run build

# ─────────────────────────────────────────────
# Stage 3: Production runner (image minimal)
# ─────────────────────────────────────────────
FROM node:24-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Hanya copy artefak build yang diperlukan
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000

CMD ["node", "server.js"]

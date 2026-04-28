FROM node:22-bookworm-slim AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY tsconfig.json ./
COPY src ./src

RUN npm run build

FROM node:22-bookworm-slim AS production

RUN apt-get update && apt-get install -y --no-install-recommends \
    chromium \
    libnss3 \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libcups2 \
    libdrm2 \
    libxkbcommon0 \
    libxcomposite1 \
    libxdamage1 \
    libxfixes3 \
    libxrandr2 \
    libgbm1 \
    libasound2 \
    fonts-liberation \
    && rm -rf /var/lib/apt/lists/*

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/dist ./dist

VOLUME ["/app/data", "/app/screenshots"]

ENV NODE_ENV=production
ENV PORT=3001
ENV DATA_DIR=/app/data
ENV SCREENSHOTS_DIR=/app/screenshots

EXPOSE 3001

CMD ["node", "dist/index.js"]

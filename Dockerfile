FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci --ignore-scripts
FROM node:22-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build
FROM node:22-alpine AS web
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup -S nexodent && adduser -S nexodent -G nexodent
COPY --from=build --chown=nexodent:nexodent /app/.next/standalone ./
COPY --from=build --chown=nexodent:nexodent /app/.next/static ./.next/static
COPY --from=build --chown=nexodent:nexodent /app/public ./public
USER nexodent
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --retries=3 CMD wget -qO- http://127.0.0.1:3000/api/health/ready || exit 1
CMD ["node","server.js"]
FROM deps AS worker
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup -S nexodent && adduser -S nexodent -G nexodent
COPY --chown=nexodent:nexodent tsconfig.json ./
COPY --chown=nexodent:nexodent workers ./workers
COPY --chown=nexodent:nexodent lib ./lib
COPY --chown=nexodent:nexodent features ./features
COPY --chown=nexodent:nexodent db ./db
USER nexodent
CMD ["node","workers/entrypoint.mjs"]

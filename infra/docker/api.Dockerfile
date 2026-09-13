FROM node:20-bookworm-slim AS base
RUN apt-get update && apt-get install -y --no-install-recommends \
    openssl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

FROM base AS deps
COPY apps/api/package.json apps/api/package-lock.json* ./
RUN npm install

FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY apps/api .
RUN npx prisma generate
RUN npm run build

FROM base AS runtime
ENV NODE_ENV=production
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma
COPY apps/api/package.json ./
EXPOSE 4000
CMD ["node", "dist/src/main.js"]
FROM node:20-bookworm-slim AS base
WORKDIR /app

FROM base AS deps
COPY apps/web/package.json apps/web/package-lock.json* ./
RUN npm install

FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY apps/web .
RUN npm run build

FROM base AS runtime
ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/.next ./.next
COPY --from=build /app/public ./public
COPY apps/web/package.json apps/web/next.config.mjs ./
EXPOSE 3000
CMD ["npm", "run", "start"]

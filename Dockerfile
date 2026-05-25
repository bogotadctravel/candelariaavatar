FROM node:22-bookworm-slim AS base

ENV NEXT_TELEMETRY_DISABLED=1
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

RUN corepack enable

FROM base AS deps

WORKDIR /app

COPY package.json pnpm-lock.yaml ./

RUN pnpm install --frozen-lockfile

FROM base AS builder

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

ARG LIVEKIT_API_KEY
ARG LIVEKIT_API_SECRET
ARG LIVEKIT_URL
ARG NEXT_PUBLIC_APP_CONFIG_ENDPOINT
ARG NEXT_PUBLIC_CONN_DETAILS_ENDPOINT
ARG SANDBOX_ID

ENV LIVEKIT_API_KEY=${LIVEKIT_API_KEY}
ENV LIVEKIT_API_SECRET=${LIVEKIT_API_SECRET}
ENV LIVEKIT_URL=${LIVEKIT_URL}
ENV NEXT_PUBLIC_APP_CONFIG_ENDPOINT=${NEXT_PUBLIC_APP_CONFIG_ENDPOINT}
ENV NEXT_PUBLIC_CONN_DETAILS_ENDPOINT=${NEXT_PUBLIC_CONN_DETAILS_ENDPOINT}
ENV SANDBOX_ID=${SANDBOX_ID}

RUN pnpm build && pnpm prune --prod

FROM node:22-bookworm-slim AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

COPY --from=builder --chown=node:node /app/package.json ./package.json
COPY --from=builder --chown=node:node /app/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --from=builder --chown=node:node /app/node_modules ./node_modules
COPY --from=builder --chown=node:node /app/.next ./.next
COPY --from=builder --chown=node:node /app/public ./public
COPY --from=builder --chown=node:node /app/server.js ./server.js

USER node

EXPOSE 3001

CMD ["node", "server.js"]

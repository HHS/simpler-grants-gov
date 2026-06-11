# This file is largely based on the template-application-flask Dockerfile and
# Next.js Docker example: https://github.com/vercel/next.js/blob/canary/examples/with-docker-compose
# =============================================================================
FROM node:24-bookworm-slim AS base
WORKDIR /frontend

# Install dependencies
COPY package.json package-lock.json ./
COPY public ./public
COPY scripts ./scripts
RUN npm ci --no-audit \
  # Remove dev packages not removed by `npm prune` maybe from older storybook?
  && rm -rf /frontend/node_modules/@esbuild

# =============================================================================
# Development stage
# =============================================================================
FROM base AS dev
WORKDIR /frontend

COPY tsconfig.json .
COPY *.config.js ./
COPY *.d.ts ./
COPY src ./src
COPY stories ./stories
COPY .storybook ./.storybook

ENV NEXT_TELEMETRY_DISABLED 1

CMD ["npm", "run", "dev"]

# =============================================================================
# Release stage
# =============================================================================

# Build the Next.js front end
# =====================================
FROM base AS builder
WORKDIR /frontend

COPY tsconfig.json .
COPY *.config.js .
COPY *.d.ts .
COPY src ./src

ENV NEXT_TELEMETRY_DISABLED 1

# let the application know that it is being built
ENV NEXT_BUILD true

# Skip lint because it should have happened in the CI already
RUN npm run build

# Run the Next.js server
# =====================================
# Use clean image for release, excluding any unnecessary files or dependencies
FROM node:24-bookworm-slim AS release
WORKDIR /frontend

# Update system and install security updates
RUN apt-get update \
  && apt-get install -y --no-install-recommends \
       dpkg=1.21.23 \
       libc-bin=2.36-9+deb12u14 \
       libc6=2.36-9+deb12u14 \
       libgcrypt20=1.10.1-3+deb12u1 \
       libgnutls30=3.7.9-2+deb12u7 \
       libsystemd0=252.39-1~deb12u2 \
       libudev1=252.39-1~deb12u2 \
       libcap2=1:2.66-4+deb12u3+b1 \
       sed=4.9-1+deb12u1 \
       wget=1.21.3-1+deb12u1 \
  && apt-get clean \
  && rm -rf /var/lib/apt/lists/*

RUN mkdir -p /frontend/.next/cache/images/
VOLUME ["/frontend/.next/cache/images/"]

# Remove dev dependencies after build
RUN npm prune --production

# Release stage doesn't have a need for `npm`, so remove it to avoid
# any vulnerabilities specific to NPM
RUN npm uninstall -g npm
# Remove yarn as well (https://github.com/nodejs/docker-node/issues/777)
RUN rm -rf /opt/yarn-v*

# Don't run production as root
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
RUN chown nextjs:nodejs /frontend/.next/cache/images/
USER nextjs

COPY --from=builder /frontend/public ./public

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=builder --chown=nextjs:nodejs /frontend/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /frontend/.next/static ./.next/static

# Environment variables must be redefined at run time
# ARG ENV_VARIABLE
# ENV ENV_VARIABLE=${ENV_VARIABLE}
# ARG NEXT_PUBLIC_ENV_VARIABLE
# ENV NEXT_PUBLIC_ENV_VARIABLE=${NEXT_PUBLIC_ENV_VARIABLE}

ARG SENDY_API_KEY
ENV SENDY_API_KEY=${SENDY_API_KEY}
ARG SENDY_API_URL
ENV SENDY_API_URL=${SENDY_API_URL}
ARG SENDY_LIST_ID
ENV SENDY_LIST_ID=${SENDY_LIST_ID}

ENV NEXT_TELEMETRY_DISABLED 1
ENV PORT 3000
ENV NEXT_BUILD false

EXPOSE 3000

CMD ["node", "server.js"]

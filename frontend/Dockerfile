# This file is largely based on the template-application-flask Dockerfile and
# Next.js Docker example: https://github.com/vercel/next.js/blob/canary/examples/with-docker-compose
# =============================================================================
FROM node:18-bullseye-slim AS base
WORKDIR /frontend

# Install dependencies
COPY package.json package-lock.json ./
COPY public ./public
COPY scripts ./scripts
RUN npm ci --no-audit

# =============================================================================
# Development stage
# =============================================================================
FROM base AS dev
WORKDIR /frontend

COPY tsconfig.json .
COPY *.config.js .
COPY *.d.ts .
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

# Environment variables must be present at build time
# https://github.com/vercel/next.js/discussions/14030
# ARG ENV_VARIABLE
# ENV ENV_VARIABLE=${ENV_VARIABLE}
# ARG NEXT_PUBLIC_ENV_VARIABLE
# ENV NEXT_PUBLIC_ENV_VARIABLE=${NEXT_PUBLIC_ENV_VARIABLE}

ENV NEXT_TELEMETRY_DISABLED 1

# Skip lint because it should have happened in the CI already
RUN npm run build -- --no-lint

# Run the Next.js server
# =====================================
# Use clean image for release, excluding any unnecessary files or dependencies
FROM node:18-bullseye-slim AS release
WORKDIR /frontend

# Release stage doesn't have a need for `npm`, so remove it to avoid
# any vulnerabilities specific to NPM
RUN npm uninstall -g npm
# Remove yarn as well (https://github.com/nodejs/docker-node/issues/777)
RUN rm -rf /opt/yarn-v*

# Don't run production as root
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
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
ENV NEXT_TELEMETRY_DISABLED 1
ENV PORT 3000

EXPOSE 3000

CMD ["node", "server.js"]

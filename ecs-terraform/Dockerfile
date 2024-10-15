FROM hashicorp/terraform:1.9.7 AS base

RUN mkdir -p /app
WORKDIR /app

COPY --from=top-level-directory bin /app/bin
COPY --from=top-level-directory infra /app/infra
COPY --from=top-level-directory Makefile /app/Makefile

FROM base AS dev

RUN apk update \
  && apk upgrade \
  && apk add --no-cache \
  coreutils \
  bash

FROM base AS release

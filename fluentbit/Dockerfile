# Build on top of the buildpack-deps image so that we have a
# standard selection of tools available (ls, cat, etc.)
# This produces a large image overall,
# but the image is dramatically easier to work with.
FROM buildpack-deps:oracular AS build

# Copy the fluentbit binary from the official image.
FROM fluent/fluent-bit:4.0.8 AS fluentbit

FROM build AS release

COPY --from=fluentbit /fluent-bit /fluent-bit

# The healthcheck is used to determine if the container is running.
# AWS doesn't use it, but it's useful for local development.
HEALTHCHECK --timeout=5s --interval=10s --start-period=20s \
  CMD ["curl", "http://localhost:80/api/v1/health"]

# We copy into `/fluent-bit/etc/fluent-bit-custom.yml` because AWS
# will overwrite any `/fluent-bit/etc/fluent-bit.yml` on the container.
COPY fluentbit.yml /fluent-bit/etc/fluent-bit-custom.yml

# Copy the Lua script for log truncation
COPY truncate_logs.lua /fluent-bit/etc/truncate_logs.lua

ENTRYPOINT ["/fluent-bit/bin/fluent-bit"]

CMD ["-c", "/fluent-bit/etc/fluent-bit-custom.yml"]

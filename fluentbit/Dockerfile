FROM amazon/aws-for-fluent-bit:3.2.6 as fluentbit

FROM fluentbit AS release

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

CMD ["/fluent-bit/bin/fluent-bit", "-c", "/fluent-bit/etc/fluent-bit-custom.yml"]

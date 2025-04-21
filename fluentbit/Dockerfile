# Build on top of the ubuntu base image so that we have a
# standard selection of tools available (ls, cat, etc.)
FROM ubuntu:24.04 AS build

# Copy the fluent-bit binary from the official image.
FROM fluent/fluent-bit:4.0.0 AS fluentbit

FROM build AS release

COPY --from=fluentbit /fluent-bit /fluent-bit

ENTRYPOINT ["/fluent-bit/bin/fluent-bit"]

ENV FLB_LOG_LEVEL=debug

COPY fluentbit.conf /fluent-bit/etc/fluent-bit-custom.conf

CMD ["-c", "/fluent-bit/etc/fluent-bit-custom.conf"]

FROM fluent/fluent-bit:1.9.10 AS fluentbit

ENTRYPOINT ["/fluent-bit/bin/fluent-bit"]

ENV FLB_LOG_LEVEL=debug

COPY fluentbit.conf /fluent-bit/etc/fluent-bit-custom.conf

CMD ["-c", "/fluent-bit/etc/fluent-bit-custom.conf"]

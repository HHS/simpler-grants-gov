FROM ubuntu:24.04 AS build

# Install ca-certificates first for proper repository access
RUN apt-get update && apt-get install -y ca-certificates gnupg curl && \
  apt-get clean && rm -rf /var/lib/apt/lists/*

# Install build dependencies
RUN apt-get update && apt-get install -y \
  unzip \
  make \
  gcc \
  libc6-dev \
  git \
  wget \
  libyaml-0-2 \
  libpq-dev \
  bison \
  gawk \
  python3 \
  && apt-get clean && rm -rf /var/lib/apt/lists/*

FROM fluent/fluent-bit:4.0.0 AS fluentbit

FROM build AS release

COPY --from=fluentbit /fluent-bit /fluent-bit

ENTRYPOINT ["/fluent-bit/bin/fluent-bit"]

COPY fluentbit.conf /fluent-bit/etc/fluent-bit.conf

CMD ["-c", "/fluent-bit/etc/fluent-bit.conf"]

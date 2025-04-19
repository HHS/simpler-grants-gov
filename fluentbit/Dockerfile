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

# Install Golang from official distribution (more reliable than package manager)
RUN wget https://golang.org/dl/go1.20.12.linux-amd64.tar.gz && \
  tar -C /usr/local -xzf go1.20.12.linux-amd64.tar.gz && \
  rm go1.20.12.linux-amd64.tar.gz

# Set up Go environment
ENV PATH=$PATH:/usr/local/go/bin:/root/go/bin
ENV GOPATH=/root/go

# Install required Go tools
RUN mkdir -p /root/go/bin && \
  go version && \
  go install golang.org/x/lint/golint@latest && \
  go install github.com/golang/mock/mockgen@latest

FROM fluent/fluent-bit:4.0.0 AS fluentbit

FROM build AS release

COPY --from=fluentbit /fluent-bit /fluent-bit

# New Relic plugin
ADD https://github.com/newrelic/newrelic-fluent-bit-output/releases/download/v2.3.0/out_newrelic-linux-amd64-2.3.0.so /fluent-bit/bin/out_newrelic.so
RUN chmod a+x /fluent-bit/bin/out_newrelic.so

# AWS CloudWatch plugin
ADD https://github.com/aws/amazon-cloudwatch-logs-for-fluent-bit/archive/refs/tags/v1.9.4.zip /tmp/cloudwatch-logs.zip

# Build CloudWatch plugin with Go environment properly set up
RUN unzip /tmp/cloudwatch-logs.zip -d /tmp/ && \
  cd /tmp/amazon-cloudwatch-logs-for-fluent-bit-1.9.4 && \
  export PATH=$PATH:/usr/local/go/bin:/root/go/bin && \
  export GOPATH=/root/go && \
  go version && \
  make && \
  cp ./bin/cloudwatch.so /fluent-bit/bin/out_cloudwatch.so && \
  chmod a+x /fluent-bit/bin/out_cloudwatch.so

ENTRYPOINT ["/fluent-bit/bin/fluent-bit"]

COPY fluentbit.conf /fluent-bit/etc/fluent-bit.conf

CMD ["-e", "/fluent-bit/bin/out_newrelic.so", "-e", "/fluent-bit/bin/out_cloudwatch.so", "-c", "/fluent-bit/etc/fluent-bit.conf"]

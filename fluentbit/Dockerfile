FROM ubuntu:24.04

# Install dependencies for building Fluent Bit with plugins
RUN apt-get update && apt-get install -y \
  gcc \
  g++ \
  make \
  cmake \
  wget \
  libssl-dev \
  libyaml-dev \
  pkg-config \
  git \
  flex \
  bison \
  libsasl2-dev

RUN git clone https://github.com/fluent/fluent-bit.git /fluent-bit-src

WORKDIR /fluent-bit-src
RUN git checkout v3.2.9

RUN cmake \
  -DFLB_OUT_NEWRELIC=On \
  -DFLB_OUT_CLOUDWATCH=On \
  -DFLB_RELEASE=On \
  . && make && make install

ENTRYPOINT ["/fluent-bit/bin/fluent-bit"]

COPY fluentbit.conf /fluent-bit/etc/fluent-bit.conf

CMD ["-c", "/fluent-bit/etc/fluent-bit.conf"]

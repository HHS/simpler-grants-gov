# Fluentbit

Fluent Bit is a log processor and forwarder designed for collecting, parsing, and shipping logs to various destinations. It handles data from multiple sources, making it ideal for cloud-native and containerized environments like AWS ECS. We use it to forward logs from our containers to both AWS Cloudwatch and New Relic.

## Deployment

We have a custom build of fluentbit, that can be from built like so, from the top level directory (eg. not this one, the one above it)

```bash
env APP_NAME=fluentbit make release-build
env APP_NAME=fluentbit make release-publish
```

After you publish a new version of fluentbit, store it the git commit has you just deployed inside of the `fluent-bit-commit` SSM parameter. The next deploy of our services will then start using that commit.

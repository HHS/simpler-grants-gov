# Fluentbit

Fluent Bit is a log processor and forwarder designed for collecting, parsing, and shipping logs to various destinations. It handles data from multiple sources, making it ideal for cloud-native and containerized environments like AWS ECS. We use it to forward logs from our containers to both AWS Cloudwatch and New Relic.

## Deployment

We have a custom build of fluentbit, that can be from built like so, from the top level directory (eg. not this one, the one above it)

```bash
env IMAGE_NAME=$(git rev-parse HEAD) APP_NAME=fluentbit make release-build
env IMAGE_NAME=$(git rev-parse HEAD) APP_NAME=fluentbit make release-publish
```

After you deploy a new version of fluentbit, store it the git commit has you just deployed inside of `infra/project-config/main.tf`. That image version should now deploy beside all of our primary application containers.

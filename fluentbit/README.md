# Fluentbit

Fluent Bit is a log processor and forwarder designed for collecting, parsing, and shipping logs to various destinations. It handles data from multiple sources, making it ideal for cloud-native and containerized environments like AWS ECS. We use it to forward logs from our containers to both AWS Cloudwatch and New Relic.

## Deployment

We have a custom build of fluentbit, that can be from built like so, from the top level directory (eg. not this one, the one above it)

```bash
env APP_NAME=fluentbit make release-build
env APP_NAME=fluentbit make release-publish
```

After you publish a new version of fluentbit, store it the git commit has you just deployed inside of the `fluent-bit-commit` [SSM parameter](https://us-east-1.console.aws.amazon.com/systems-manager/parameters/fluent-bit-commit/). The next deploy of our services will then start using that commit.

## Testing

Getting setup for testing the first time is a multi-stage process

1. `env APP_NAME=fluentbit make release-build` from above
2. `brew install ruby`
3. `gem install fluentd`
4. 2 terminals

  - `docker run -p 24224:24224 -e licenseKey=key -e log_group_name=my-log-group -e aws_region=us-east-1 docker.io/library/simpler-grants-gov-fluentbit:latest`
  - `echo '{"cat": "hat"}' | fluent-cat -`

5. You should see your json echo'ed into terminal 1

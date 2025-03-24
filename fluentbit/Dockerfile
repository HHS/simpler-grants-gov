# The image is via https://docs.newrelic.com/install/aws-logs/?service=ECS&forward_ECS=sidecar_firelens
# Use the following command to get a list of available versions:
# aws ecr list-images --repository-name newrelic/logging-firelens-fluentbit --registry-id 533243300146 --query "imageIds[].imageTag" --output text

FROM 533243300146.dkr.ecr.us-east-1.amazonaws.com/newrelic/logging-firelens-fluentbit:2.3.0

COPY fluentbit.conf /fluent-bit/etc/fluent-bit.conf

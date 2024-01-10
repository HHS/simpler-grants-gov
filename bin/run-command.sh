#!/bin/bash
# -----------------------------------------------------------------------------
# Run an application command using the application image
# 
# Optional parameters:
#   --environment-variables - a JSON list of environment variables to add to the
#     the container. Each environment variable is an object with the "name" key
#     specifying the name of the environment variable and the "value" key
#     specifying the value of the environment variable.
#     e.g. '[{ "name" : "DB_USER", "value" : "migrator" }]'
#   --task-role-arn - the IAM role ARN that the task should assume. Overrides the
#     task role specified in the task definition.
#
# Positional parameters:
#   APP_NAME (required) - the name of subdirectory of /infra that holds the
#     application's infrastructure code.
#   ENVIRONMENT (required) - the name of the application environment (e.g. dev,
#     staging, prod)
#   COMMAND (required) - a JSON list representing the command to run
#     e.g. To run the command `db-migrate-up` with no arguments, set
#     COMMAND='["db-migrate-up"]'
#     e.g. To run the command `echo "Hello, world"` set
#     COMMAND='["echo", "Hello, world"]')
# -----------------------------------------------------------------------------
set -euo pipefail

# Parse optional parameters
ENVIRONMENT_VARIABLES=""
TASK_ROLE_ARN=""
while :; do
  case $1 in
    --environment-variables)
      ENVIRONMENT_VARIABLES=$2
      shift 2
      ;;
    --task-role-arn)
      TASK_ROLE_ARN=$2
      shift 2
      ;;
    *)
      break
      ;;
  esac
done

APP_NAME="$1"
ENVIRONMENT="$2"
COMMAND="$3"

echo "==============="
echo "Running command"
echo "==============="
echo "Input parameters"
echo "  APP_NAME=$APP_NAME"
echo "  ENVIRONMENT=$ENVIRONMENT"
echo "  COMMAND=$COMMAND"
echo "  ENVIRONMENT_VARIABLES=${ENVIRONMENT_VARIABLES:-}"
echo "  TASK_ROLE_ARN=${TASK_ROLE_ARN:-}"
echo

# Use the same cluster, task definition, and network configuration that the application service uses
CLUSTER_NAME=$(terraform -chdir="infra/$APP_NAME/service" output -raw service_cluster_name)
SERVICE_NAME=$(terraform -chdir="infra/$APP_NAME/service" output -raw service_name)

# Get the log group and log stream prefix so that we can print out the ECS task's logs after running the task
LOG_GROUP=$(terraform -chdir="infra/$APP_NAME/service" output -raw application_log_group)
LOG_STREAM_PREFIX=$(terraform -chdir="infra/$APP_NAME/service" output -raw application_log_stream_prefix)

SERVICE_TASK_DEFINITION_ARN=$(aws ecs describe-services --no-cli-pager --cluster "$CLUSTER_NAME" --services "$SERVICE_NAME" --query "services[0].taskDefinition" --output text)
# For subsequent commands, use the task definition family rather than the service's task definition ARN
# because in the case of migrations, we'll deploy a new task definition revision before updating the
# service, so the service will be using an old revision, but we want to use the latest revision.
TASK_DEFINITION_FAMILY=$(aws ecs describe-task-definition --no-cli-pager --task-definition "$SERVICE_TASK_DEFINITION_ARN" --query "taskDefinition.family" --output text)

NETWORK_CONFIG=$(aws ecs describe-services --no-cli-pager --cluster "$CLUSTER_NAME" --services "$SERVICE_NAME" --query "services[0].networkConfiguration")
CURRENT_REGION=$(./bin/current-region.sh)
AWS_USER_ID=$(aws sts get-caller-identity --no-cli-pager --query UserId --output text)

CONTAINER_NAME=$(aws ecs describe-task-definition --task-definition "$TASK_DEFINITION_FAMILY" --query "taskDefinition.containerDefinitions[0].name" --output text)

OVERRIDES=$(cat << EOF
{
  "containerOverrides": [
    {
      "name": "$CONTAINER_NAME",
      "command": $COMMAND
    }
  ]
}
EOF
)

if [ -n "$ENVIRONMENT_VARIABLES" ]; then
  OVERRIDES=$(echo "$OVERRIDES" | jq ".containerOverrides[0].environment |= $ENVIRONMENT_VARIABLES")
fi

if [ -n "$TASK_ROLE_ARN" ]; then
  OVERRIDES=$(echo "$OVERRIDES" | jq ".taskRoleArn |= \"$TASK_ROLE_ARN\"")
fi

TASK_START_TIME=$(date +%s)
TASK_START_TIME_MILLIS=$((TASK_START_TIME * 1000))

AWS_ARGS=(
  ecs run-task
  --region="$CURRENT_REGION"
  --cluster="$CLUSTER_NAME"
  --task-definition="$TASK_DEFINITION_FAMILY"
  --started-by="$AWS_USER_ID"
  --launch-type=FARGATE
  --platform-version=1.4.0
  --network-configuration "$NETWORK_CONFIG"
  --overrides "$OVERRIDES"
)
echo "::group::Running AWS CLI command"
printf " ... %s\n" "${AWS_ARGS[@]}"
TASK_ARN=$(aws --no-cli-pager "${AWS_ARGS[@]}" --query "tasks[0].taskArn" --output text)
echo "::endgroup::"
echo

# Get the task id by extracting the substring after the last '/' since the task ARN is of
# the form "arn:aws:ecs:<region>:<account id>:task/<cluster name>/<task id>"
ECS_TASK_ID=$(basename "$TASK_ARN")

# The log stream has the format "prefix-name/container-name/ecs-task-id"
# See https://docs.aws.amazon.com/AmazonECS/latest/userguide/using_awslogs.html
LOG_STREAM="$LOG_STREAM_PREFIX/$CONTAINER_NAME/$ECS_TASK_ID"

# Wait for log stream to be created before fetching the logs.
# The reason we don't use the `aws ecs wait tasks-running` command is because
# that command can fail on short-lived tasks. In particular, the command polls
# every 6 seconds with describe-tasks until tasks[].lastStatus is RUNNING. A
# task that completes quickly can go from PENDING to STOPPED, causing the wait
# command to error out.
echo "Waiting for log stream to be created"
echo "  TASK_ARN=$TASK_ARN"
echo "  TASK_ID=$ECS_TASK_ID"
echo "  LOG_STREAM=$LOG_STREAM"

NUM_RETRIES_WAITIN_FOR_LOGS=0
while true; do
  NUM_RETRIES_WAITIN_FOR_LOGS=$((NUM_RETRIES_WAITIN_FOR_LOGS+1))
  if [ $NUM_RETRIES_WAITIN_FOR_LOGS -eq 20 ]; then
    echo "Timing out task $ECS_TASK_ID waiting for logs"
    exit 1
  fi
  IS_LOG_STREAM_CREATED=$(aws logs describe-log-streams --no-cli-pager --log-group-name "$LOG_GROUP" --query "length(logStreams[?logStreamName==\`$LOG_STREAM\`])")
  if [ "$IS_LOG_STREAM_CREATED" == "1" ]; then
    break
  fi
  sleep 5
  echo -n "."
done
echo
echo

# Tail logs until task stops using a loop that polls for new logs.
# The reason why we don't use `aws logs tail` is because that command is meant
# for interactive use. In particular, it will wait forever for new logs, even
# after a task stops, until the user hits Ctrl+C. And the reason why we don't
# wait until the task completes first before fetching logs is so that we can
# show logs in near real-time, which can be useful for long running tasks.
echo "::group::Tailing logs until task stops"
echo "  LOG_GROUP=$LOG_GROUP"
echo "  LOG_STREAM=$LOG_STREAM"
echo "  TASK_START_TIME_MILLIS=$TASK_START_TIME_MILLIS"
# Initialize the logs start time filter to the time we started the task
LOGS_START_TIME_MILLIS=$TASK_START_TIME_MILLIS
while true; do
  # Print logs with human readable timestamps by fetching the log events as JSON
  # then transforming them afterwards using jq
  LOG_EVENTS=$(aws logs get-log-events \
    --no-cli-pager \
    --log-group-name "$LOG_GROUP" \
    --log-stream-name "$LOG_STREAM" \
    --start-time "$LOGS_START_TIME_MILLIS" \
    --start-from-head \
    --no-paginate \
    --output json)
  # Divide timestamp by 1000 since AWS timestamps are in milliseconds
  echo "$LOG_EVENTS" | jq -r '.events[] | ((.timestamp / 1000 | strftime("%Y-%m-%d %H:%M:%S")) + "\t" + .message)'

  # If the task stopped, then stop tailing logs
  LAST_TASK_STATUS=$(aws ecs describe-tasks --cluster "$CLUSTER_NAME" --tasks "$TASK_ARN" --query "tasks[0].containers[?name=='$CONTAINER_NAME'].lastStatus" --output text)
  if [ "$LAST_TASK_STATUS" = "STOPPED" ]; then
    break
  fi

  # If there were new logs printed, then update the logs start time filter
  # to be the last log's timestamp + 1
  LAST_LOG_TIMESTAMP=$(echo "$LOG_EVENTS" | jq -r '.events[-1].timestamp' )
  if [ "$LAST_LOG_TIMESTAMP" != "null" ]; then
    LOGS_START_TIME_MILLIS=$((LAST_LOG_TIMESTAMP + 1))
  fi

  # Give the application a moment to generate more logs before fetching again
  sleep 1
done
echo "::endgroup::"
echo

CONTAINER_EXIT_CODE=$(
  aws ecs describe-tasks \
  --cluster "$CLUSTER_NAME" \
  --tasks "$TASK_ARN" \
  --query "tasks[0].containers[?name=='$CONTAINER_NAME'].exitCode" \
  --output text
)

if [[ "$CONTAINER_EXIT_CODE" == "null" || "$CONTAINER_EXIT_CODE" != "0" ]]; then
  echo "Task failed" >&2
  # Although we could avoid extra calls to AWS CLI if we just got the full JSON response from
  # `aws ecs describe-tasks` and parsed it with jq, we are trying to avoid unnecessary dependencies.
  CONTAINER_STATUS=$(aws ecs describe-tasks --cluster "$CLUSTER_NAME" --tasks "$TASK_ARN" --query "tasks[0].containers[?name=='$CONTAINER_NAME'].[lastStatus,exitCode,reason]" --output text)
  TASK_STATUS=$(aws ecs describe-tasks --cluster "$CLUSTER_NAME" --tasks "$TASK_ARN" --query "tasks[0].[lastStatus,stopCode,stoppedAt,stoppedReason]" --output text)

  echo "Container status (lastStatus, exitCode, reason): $CONTAINER_STATUS" >&2
  echo "Task status (lastStatus, stopCode, stoppedAt, stoppedReason): $TASK_STATUS" >&2
  exit 1
fi

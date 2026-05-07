#!/bin/bash
# wait-for-local-dynamodb

set -e

# Color formatting
RED='\033[0;31m'
NO_COLOR='\033[0m'

MAX_WAIT_TIME=60 # seconds
WAIT_TIME=0

# First check if HTTP endpoint is up
echo "Checking if DynamoDB Local HTTP endpoint is up..."
until curl --output /dev/null --silent http://localhost:8000/;
do
  echo "waiting on DynamoDB Local HTTP endpoint to initialize..."
  sleep 3

  WAIT_TIME=$(($WAIT_TIME+3))
  if [ $WAIT_TIME -gt $MAX_WAIT_TIME ]
  then
    echo -e "${RED}ERROR: DynamoDB Local HTTP endpoint not responding, running \"docker logs dynamodb-local\" to troubleshoot.${NO_COLOR}"
    docker logs dynamodb-local
    exit 1
  fi
done

echo "DynamoDB Local HTTP endpoint is up after ~${WAIT_TIME} seconds"


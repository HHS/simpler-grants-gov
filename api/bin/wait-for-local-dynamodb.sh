#!/usr/bin/env sh
# wait-for-local-dynamodb

set -e

# Color formatting
RED='\033[0;31m'
NO_COLOR='\033[0m'

MAX_WAIT_TIME=30 # seconds
WAIT_TIME=0

# Curl the ListTables endpoint of DynamoDB Local
# until it returns a success response
until curl --output /dev/null --silent http://localhost:8000/;
do
  echo "waiting on DynamoDB Local to initialize..."
  sleep 3

  WAIT_TIME=$(($WAIT_TIME+3))
  if [ $WAIT_TIME -gt $MAX_WAIT_TIME ]
  then
    echo -e "${RED}ERROR: DynamoDB Local appears to not be starting up, running \"docker logs dynamodb-local\" to troubleshoot.${NO_COLOR}"
    docker logs dynamodb-local
    exit 1
  fi
done

echo "DynamoDB Local is ready after ~${WAIT_TIME} seconds"


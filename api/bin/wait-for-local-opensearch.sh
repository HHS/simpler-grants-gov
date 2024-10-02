#!/bin/bash
# wait-for-local-opensearch

set -e

# Color formatting
RED='\033[0;31m'
NO_COLOR='\033[0m'

MAX_WAIT_TIME=30 # seconds
WAIT_TIME=0

# Curl the healthcheck endpoint of the local opensearch
# until it returns a success response
until curl --output /dev/null --silent http://localhost:9200/_cluster/health;
do
  echo "waiting on OpenSearch to initialize..."
  sleep 3

  WAIT_TIME=$(($WAIT_TIME+3))
  if [ $WAIT_TIME -gt $MAX_WAIT_TIME ]
  then
    echo -e "${RED}ERROR: OpenSearch appears to not be starting up, running \"docker logs opensearch-node\" to troubleshoot.${NO_COLOR}"
    docker logs opensearch-node
    exit 1
  fi
done

echo "OpenSearch is ready after ~${WAIT_TIME} seconds"



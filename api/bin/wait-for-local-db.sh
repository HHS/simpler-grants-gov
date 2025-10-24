#!/bin/bash
# wait-for-local-db

set -e

# Color formatting
RED='\033[0;31m'
GREEN='\033[0;32m'
NO_COLOR='\033[0m'

MAX_WAIT_TIME=30 # seconds
WAIT_TIME=0

# Use pg_isready inside the docker container to wait for the DB to be ready
# We check every 3 seconds and consider it failed if it gets to 30+
# https://www.postgresql.org/docs/current/app-pg-isready.html
until docker exec grants-db pg_isready -h localhost -d grants-db -q > /dev/null 2>&1;
do
  echo "waiting on Postgres DB to initialize..."
  sleep 3

  WAIT_TIME=$(($WAIT_TIME+3))
  if [ $WAIT_TIME -gt $MAX_WAIT_TIME ]
  then
    echo -e "${RED}ERROR: Database appears to not be starting up, running \"docker logs grants-db\" to troubleshoot.${NO_COLOR}"
    docker logs grants-db
    exit 1
  fi
done

echo -e "${GREEN}Postgres DB is ready after ~${WAIT_TIME} seconds${NO_COLOR}"



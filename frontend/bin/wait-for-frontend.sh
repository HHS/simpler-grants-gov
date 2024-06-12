# wait-for-frontend.sh

#!/bin/bash
set -e

# Color formatting for readability
GREEN='\033[0;32m'
RED='\033[0;31m'
NO_COLOR='\033[0m'

MAX_WAIT_TIME=800 # seconds, adjust as necessary
WAIT_TIME=0


echo "Waiting for server to become ready..."

# Use curl to check the server health endpoint
until curl --output /dev/null --silent --head --fail http://localhost:3000;
do
  printf '.'
  sleep 5

  WAIT_TIME=$(($WAIT_TIME + 5))
  if [ $WAIT_TIME -gt $MAX_WAIT_TIME ]
  then
    echo -e "${RED}ERROR: Server did not become ready within ${MAX_WAIT_TIME} seconds.${NO_COLOR}"
    exit 1
  fi
done

echo -e "${GREEN}Server is ready after ~${WAIT_TIME} seconds.${NO_COLOR}"

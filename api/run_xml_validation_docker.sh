#!/bin/bash
# Docker-based XML validation script runner
# This script runs the validation tests inside the Docker container
# to ensure all dependencies are available.

set -e

# Check if Docker Compose is available
if ! command -v docker-compose &> /dev/null && ! command -v docker &> /dev/null; then
    echo "Error: Docker or Docker Compose is not installed or not in PATH"
    exit 1
fi

# Use docker compose if available, otherwise fall back to docker-compose
if command -v docker &> /dev/null && docker compose version &> /dev/null; then
    DOCKER_CMD="docker compose"
elif command -v docker-compose &> /dev/null; then
    DOCKER_CMD="docker-compose"
else
    echo "Error: Neither 'docker compose' nor 'docker-compose' is available"
    exit 1
fi

echo "Running XML validation tests..."
echo "================================"

# Run the validation script inside the Docker container
$DOCKER_CMD run --rm grants-api python run_xml_validation.py "$@"

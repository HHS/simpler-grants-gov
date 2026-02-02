#!/bin/zsh
# Load environment variables from a .env file, with optional file path argument
# Usage: source load_env.sh [.env file]


# Default to .env if no file specified
ENV_FILE="${1:-.env}"

# Check if the specified file exists
if [[ ! -f "$ENV_FILE" ]]; then
    echo "Error: $ENV_FILE file not found"
    exit 1
fi

echo "Loading environment variables from $ENV_FILE..."

# Show which variables will be set (optional)
echo "Setting variables:"
grep -v '^#' "$ENV_FILE" | grep -v '^$' | cut -d'=' -f1 | while read var; do
    echo "  - $var"
done

# Source the file to load environment variables
set -a  # automatically export all variables
source "$ENV_FILE"
set +a  # turn off automatic export

echo "Environment variables loaded successfully"

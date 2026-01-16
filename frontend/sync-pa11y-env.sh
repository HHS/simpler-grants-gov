#!/bin/bash

# 1. Ensure API is seeded and keys exist
cd ../api && make init && make db-seed-local-with-agencies
cd ../frontend

# Extract Public Key - keep the newlines intact so the decoder recognizes the PEM format
PUB_KEY=$(sed -En '/API_JWT_PUBLIC_KEY/,/-----END PUBLIC KEY-----/p' ../api/override.env | sed 's/API_JWT_PUBLIC_KEY=//' | tr -d '"')

# Extract the raw E2E token
E2E_TOKEN=$(cat ../api/e2e_token.tmp | sed 's/E2E_USER_AUTH_TOKEN=//' | tr -d '"')

# Update .env.local - using a heredoc with quotes around the variable ensures multi-line stability
cat << EOF > .env.local
API_JWT_PUBLIC_KEY="$PUB_KEY"
E2E_USER_AUTH_TOKEN="$E2E_TOKEN"
SESSION_SECRET="extraSecretSessionSecretValueSssh"
ENVIRONMENT="local"
EOF

echo "Environment synchronized for Pa11y."
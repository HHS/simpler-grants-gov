# Environment Variables Configuration Guide

## Overview

The simpler-grants-gov project uses environment variables across frontend, backend, and Docker services. This guide documents all required variables for local development.

---

## Frontend Environment Variables

### `.env.development` (Checked into Git)

**Purpose**: Default non-sensitive environment variables for local development with `next dev`

```env
# Application Configuration
NEXT_PUBLIC_BASE_PATH=                    # Base path for subdirectory deployment (empty for root)
ENVIRONMENT=local                         # ⭐ CRITICAL: Use 'local' to enable LOCAL_DEV detection
API_URL=http://localhost:8080            # ⚠️  When running without Docker locally
API_URL=http://grants-api:8080           # ⭐ When running in Docker containers (docker-compose)

# API Authentication
API_GW_AUTH=local-dev-api-key            # Gateway key for local API calls
AUTH_LOGIN_URL=http://localhost:8080/v1/users/login

# Authentication Expiration
AUTH_EXPIRATION_TIME=31536000000         # 1 year in milliseconds (for local dev only)

# Feature Flags
USE_SEARCH_MOCK_DATA=false               # Set to true to use mock data instead of API

# JWT Public Key (for token verification)
API_JWT_PUBLIC_KEY="-----BEGIN PUBLIC KEY-----\n..."  # For validating JWT tokens from API

# Session Configuration
SESSION_SECRET=extraSecretSessionSecretValueSssh  # Session encryption key

# Optional: New Relic Monitoring
NEW_RELIC_APP_NAME=
NEW_RELIC_LICENSE_KEY=
```

**Key Notes**:
- ✅ Safe to commit to Git (no secrets)
- ✅ `ENVIRONMENT=local` enables LOCAL_DEV detection → test user dropdown appears
- ⚠️ When running in Docker: use `API_URL=http://grants-api:8080` (not localhost!)
- ⚠️ When running locally with `next dev`: use `API_URL=http://localhost:8080`

---

### `.env.local` (NOT Checked into Git)

**Purpose**: Sensitive variables that should NOT be committed. Create this file locally.

```env
# Sendy Email Service (Secrets - DO NOT COMMIT)
SENDY_API_KEY=your-actual-key-here
SENDY_API_URL=https://sendy.example.com
SENDY_LIST_ID=your-list-id

# New Relic (Secrets - DO NOT COMMIT)
NEW_RELIC_APP_NAME=your-app-name
NEW_RELIC_LICENSE_KEY=your-license-key

# E2E Testing (optional, for Playwright tests)
E2E_USER_AUTH_TOKEN=your-jwt-token-here
PLAYWRIGHT_TARGET_ENV=local
```

**Key Notes**:
- ⭐ Copy from `.env.local.example` but add YOUR actual secrets
- ❌ NEVER commit this file to Git
- 🔒 Use for sensitive credentials only

---

## Backend (API) Environment Variables

### `api/.env` (Checked into Git)

**Purpose**: Backend server configuration for local development

```env
# Server Configuration
PORT=8080                          # API port (matches frontend API_URL)

# Authentication
AUTH_TOKEN=LOCAL_AUTH_12345678    # Must match frontend API_GW_AUTH
JWT_SECRET=local_jwt_secret_value # Secret for generating JWT tokens

# Database Configuration
DB_HOST=localhost                  # Or 'grants-db' when in Docker
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres               # Local development only (hardcoded)
DB_NAME=simpler_grants

# CORS Configuration
CORS_ORIGIN=http://localhost:3000 # Frontend URL for cross-origin requests

# OpenSearch (Search Engine)
OPENSEARCH_HOST=opensearch
OPENSEARCH_PORT=9200

# Mock Services (for local testing)
MOCK_OAUTH_URL=http://mock-oauth:5000
MOCK_SQS_URL=http://mock-sqs:9324
```

**Key Notes**:
- ⚠️ When running API in Docker: use `DB_HOST=grants-db` (not localhost)
- ⚠️ When running API locally: use `DB_HOST=localhost`
- ✅ Safe to commit (hardcoded local dev values only)

---

## Docker Compose Environment Variables

### `frontend/docker-compose.yml` (Container Environment)

**Purpose**: Environment passed to frontend container at startup

```yaml
environment:
  # Critical for LOCAL_DEV Detection
  ENVIRONMENT: "local"                    # ⭐ Enables LOCAL_DEV flag
  API_URL: "http://grants-api:8080"      # ⭐ Docker container hostname (NOT localhost)
  LOCAL_DEV: "true"                       # ⭐ Enables test user dropdown
  
  # Secrets (safe in containers, not in Git)
  SESSION_SECRET: "extraSecretSessionSecretValueSssh"
  API_JWT_PUBLIC_KEY: |                   # RSA public key (multiline)
    -----BEGIN PUBLIC KEY-----
    MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAn+VBEtznw3VN/ChVXB2I
    ...
    -----END PUBLIC KEY-----
```

**Key Notes**:
- ⭐ `LOCAL_DEV: "true"` activates test user dropdown
- ⭐ `API_URL: "http://grants-api:8080"` uses Docker container hostname
- ⭐ `ENVIRONMENT: "local"` + container API_URL = LOCAL_DEV detection works
- This overrides `.env.development` values inside the container

---

## How LOCAL_DEV Detection Works

### The Chain:

```
1. docker-compose.yml sets:
   - ENVIRONMENT=local
   - API_URL=http://grants-api:8080
   ↓
2. Frontend container loads these env vars
   ↓
3. environments.ts runs detection logic:
   if (ENVIRONMENT === "local" && 
       (API_URL.includes("localhost") || API_URL.includes("grants-api")))
   ↓
4. Sets LOCAL_DEV = "true"
   ↓
5. Layout.tsx checks LOCAL_DEV and renders TestUserSelect dropdown
   ↓
6. User selects mock user → JWT token stored in session
```

**Why this matters**:
- ✅ Without this: test dropdown doesn't appear, can't test with mock users
- ✅ Without LOCAL_DEV fix: couldn't detect "grants-api" hostname in Docker
- ✅ Now: Works both locally and in containers

---

## Environment Variable Checklist

### For Local Dev with Docker (Primary Use Case)

**Frontend `.env.development`:**
- [ ] `ENVIRONMENT=local` ⭐ Critical
- [ ] `API_URL=http://grants-api:8080` ⭐ For Docker
- [ ] `API_JWT_PUBLIC_KEY` (multiline RSA key)
- [ ] `SESSION_SECRET` set

**Frontend `docker-compose.yml`:**
- [ ] `ENVIRONMENT: "local"` ⭐ Critical
- [ ] `API_URL: "http://grants-api:8080"` ⭐ Critical
- [ ] `LOCAL_DEV: "true"` ⭐ Critical
- [ ] `SESSION_SECRET` set
- [ ] `API_JWT_PUBLIC_KEY` set

**API `.env`:**
- [ ] `PORT=8080`
- [ ] `DB_HOST=grants-db` (for Docker)
- [ ] `DB_NAME=simpler_grants`
- [ ] `CORS_ORIGIN=http://localhost:3000`

### For Local Dev without Docker (`next dev`)

**Frontend `.env.development`:**
- [ ] `ENVIRONMENT=local` ⭐ Critical
- [ ] `API_URL=http://localhost:8080` ⭐ For local API
- [ ] `API_JWT_PUBLIC_KEY` (multiline RSA key)

---

## Common Issues & Solutions

### Issue 1: Test User Dropdown Doesn't Appear

**Root Cause**: LOCAL_DEV not set to "true"

**Check**:
```bash
# In docker-compose
grep LOCAL_DEV frontend/docker-compose.yml
# Should show: LOCAL_DEV: "true"

# In running container
docker compose exec -T nextjs env | grep LOCAL_DEV
# Should output: LOCAL_DEV=true
```

**Fix**:
```yaml
# frontend/docker-compose.yml environment section must have:
LOCAL_DEV: "true"
```

---

### Issue 2: Frontend Can't Connect to API

**Root Cause**: Wrong API_URL for Docker containers

**Check**:
```bash
# Should use 'grants-api' hostname, not 'localhost'
grep API_URL frontend/.env.development
# Should show: API_URL=http://grants-api:8080
```

**Fix**:
```env
# In .env.development
API_URL=http://grants-api:8080  # NOT http://localhost:8080
```

---

### Issue 3: Frontend Sees Different API_URL Than docker-compose

**Root Cause**: docker-compose environment section is empty or wrong

**Check**:
```bash
docker compose exec -T nextjs env | grep -E "ENVIRONMENT|API_URL|LOCAL_DEV"
```

**Fix**:
```yaml
# frontend/docker-compose.yml needs explicit environment section:
environment:
  ENVIRONMENT: "local"
  API_URL: "http://grants-api:8080"
  LOCAL_DEV: "true"
```

---

## For Next Time: Branch `bhavna/Local-Env`

All these environment variables are already configured in the branch:

```bash
git checkout bhavna/Local-Env
```

Configuration locations:
- ✅ `frontend/.env.development` - Updated with correct values
- ✅ `frontend/docker-compose.yml` - Includes LOCAL_DEV=true and correct API_URL
- ✅ `frontend/src/constants/environments.ts` - Handles both localhost and grants-api
- ✅ `/start-local-environment` skill - Verifies all environment variables are set

---

## References

- **Frontend Env Docs**: [Next.js Environment Variables](https://nextjs.org/docs/app/building-your-application/configuring/environment-variables)
- **Docker Compose Env**: [Docker Compose env_file documentation](https://docs.docker.com/compose/compose-file/compose-file-v3/#env_file)
- **JWT in App**: See `frontend/src/constants/environments.ts` for how variables are loaded
- **LOCAL_DEV Usage**: See `frontend/src/components/Layout.tsx` for how test user dropdown renders

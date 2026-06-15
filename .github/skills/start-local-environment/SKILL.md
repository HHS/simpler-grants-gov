---
name: start-local-environment
description: "Use when: starting local environment, bringing up Docker services, setting up development environment, local dev setup, bootstrapping dev workspace"
---

# Start Local Environment Skill

Automates bringing up the complete local development environment for simpler-grants-gov with all critical fixes applied and verified.

## What This Skill Does

- ✅ Starts all Docker services
- ✅ Verifies services are healthy (database, API, frontend, OpenSearch, mocks)
- ✅ Tests backend connectivity and endpoints
- ✅ Confirms LOCAL_DEV environment variable fix
- ✅ Verifies test user dropdown renders
- ✅ Tests form loading with both standard and conditional schema forms
- ✅ Reports comprehensive status checklist

## Critical Environment Variables Setup

Before running services, understand what environment variables must be set and why:

### Frontend Container Environment

**Required Variables in `/frontend/docker-compose.yml`**:
```yaml
environment:
  ENVIRONMENT: "local"                    # Tells frontend it's in local dev mode
  API_URL: "http://grants-api:8080"      # Docker container hostname (NOT localhost!)
  LOCAL_DEV: "true"                       # Enables test user dropdown and debug UI
  SESSION_SECRET: "{RSA private key}"     # For session encryption
  API_JWT_PUBLIC_KEY: "{RSA public key}"  # For JWT verification
```

**Why these matter**:
- `ENVIRONMENT=local` + `API_URL containing grants-api` → Frontend detects it's in Docker local dev
- `LOCAL_DEV=true` → Activates test user dropdown (see Fix 1)
- **CRITICAL**: `API_URL` must use Docker hostname `grants-api`, NOT `localhost`
  - Inside Docker: `localhost:8080` = the container itself (wrong!)
  - Inside Docker: `grants-api:8080` = the API container (correct!)

### Backend Container Environment

**Required Variables**:
- Database connection credentials  
- OpenSearch configuration
- Mock service endpoints
- JWT signing keys

**Verify backend sees correct environment**:
```bash
docker compose exec -T grants-api env | grep -E "DATABASE|JWT|OPENSEARCH"
```

### Debugging Environment Variable Issues

**If LOCAL_DEV isn't set**:
```bash
# Check docker-compose file has it
grep -A 10 "environment:" /workspaces/simpler-grants-gov/frontend/docker-compose.yml | grep LOCAL_DEV

# Check container actually has it
docker compose exec -T nextjs env | grep LOCAL_DEV

# If missing, rebuild:
docker compose down nextjs
docker compose up -d nextjs
```

**If API_URL is wrong**:
```bash
# Check what frontend thinks API_URL is
docker compose exec -T nextjs env | grep API_URL

# Should be: http://grants-api:8080 (or http://localhost:8080 if you set it differently)

# Test if frontend can reach it
docker compose exec -T nextjs curl http://grants-api:8080/health
```

## Critical Fixes Embedded

### Fix 1: Test User Dropdown (LOCAL_DEV Detection)
**Issue**: Test user dropdown doesn't render in local dev
**Root Cause**: Original logic checked `API_URL?.includes("localhost")` but Docker containers use hostname `grants-api`
**Fix Applied**: `/frontend/src/constants/environments.ts` now checks both localhost AND `grants-api` hostname
**Why**: Docker networking uses container names instead of localhost

### Fix 2: Form Schema Processing with Conditional Keywords
**Issue**: Forms with JSON Schema conditional keywords (`if`, `then`, `else`) fail with TopLevelError
**Root Cause**: `mergeAllOf` library doesn't have resolvers for these keywords
**Fix Applied**: `/frontend/src/utils/applyForm/applyFormUtils.ts` line 703 provides resolvers for conditional keywords
**Why**: Complex forms need conditional logic keywords to pass through mergeAllOf without errors

## Common Error Patterns & What They Mean

### Error Pattern 1: "ECONNREFUSED" or "Connection refused"

**What it means**: Frontend tried to connect to backend and got rejected

**Causes** (in order of likelihood):
1. ❌ API container not started → `docker compose ps | grep grants-api`
2. ❌ API container crashed → `docker compose logs grants-api`
3. ❌ Wrong port → Check docker-compose.yml for port mappings
4. ❌ Firewall blocking port → `lsof -i :8080`

**Fix**:
```bash
# Simplest solution: restart everything
docker compose down && sleep 5 && docker compose up -d && sleep 30
```

### Error Pattern 2: "No resolver found for key if"

**What it means**: A form with conditional schema (`if`/`then`/`else`) tried to load

**Cause**: The mergeAllOf fix isn't applied in `/frontend/src/utils/applyForm/applyFormUtils.ts`

**Verify fix is present**:
```bash
grep -A 5 "resolvers:" /workspaces/simpler-grants-gov/frontend/src/utils/applyForm/applyFormUtils.ts | head -10
# Should show:
# if: (baseSchema, ifSchema) => baseSchema,
# then: (baseSchema, thenSchema) => baseSchema,
# else: (baseSchema, elseSchema) => baseSchema,
```

**Fix**:
```bash
# Rebuild frontend to get latest code
docker compose down nextjs && docker compose up -d nextjs && sleep 30
```

### Error Pattern 3: "Error processing schema"

**What it means**: Something went wrong when flattening form properties with mergeAllOf

**Debug**: Check the full error message:
```bash
docker compose logs nextjs 2>&1 | grep -A 2 "Error processing schema"
# Will show which form ID failed and why
```

### Error Pattern 4: TopLevelError Page Instead of Form

**What it means**: Form failed to load, caught exception in getFormData

**Causes**:
- Schema processing error (see Pattern 3)
- API didn't return valid form schema
- JWT authentication failed

**Debug**:
```bash
# Check logs for what actually failed
docker compose logs nextjs 2>&1 | grep "Error parsing JSON schema"

# This will show:
# - Form ID
# - Specific error message
# - Stack trace with line numbers
```

### Error Pattern 5: Test User Dropdown Doesn't Appear

**What it means**: LOCAL_DEV detection failed or TestUserSelect component isn't rendering

**Checklist**:
```bash
# 1. Is LOCAL_DEV=true?
docker compose exec -T nextjs env | grep LOCAL_DEV

# 2. Is backend returning users?
curl http://localhost:8080/local/local-users | jq 'length'

# 3. Is component in HTML?
curl -s http://localhost:3000/workspace | grep -i "testuser"

# 4. Are there JavaScript errors?
# Open DevTools → Console tab in browser
```

**Most likely cause**: `ENVIRONMENT` or `API_URL` not set in docker-compose, causing LOCAL_DEV detection to fail

**Fix**:
```bash
# Verify in docker-compose.yml
cat /workspaces/simpler-grants-gov/frontend/docker-compose.yml | grep -E "ENVIRONMENT|API_URL|LOCAL_DEV"

# Should show:
# ENVIRONMENT: "local"
# API_URL: "http://grants-api:8080"
# LOCAL_DEV: "true"
```


## Workflow

### Pre-Phase: Initial Diagnostics (If Services Won't Connect)

If you're seeing `ECONNREFUSED` errors or "Connection refused" messages, run this first:

**Check if Docker is running**:
```bash
docker ps
# Should show running containers, not "Cannot connect to Docker daemon"
```

**Check if containers started**:
```bash
docker compose ps
# Look for any containers in "Exited" or "Error" state
# All should show "Up" or "healthy"
```

**If containers won't start, check why**:
```bash
# View startup logs for failed service
docker compose logs [service-name]

# Common culprits:
docker compose logs grants-db    # Database might not initialize
docker compose logs grants-api   # API might fail to start
docker compose logs nextjs       # Frontend might not compile
```

**Verify ports aren't blocked**:
```bash
# Check if ports are actually listening
lsof -i :3000    # Frontend
lsof -i :8080    # API
lsof -i :5432    # Database
lsof -i :9200    # OpenSearch

# Or use netstat
netstat -tuln | grep -E "3000|8080|5432|9200"
```

**If services are running but still getting ECONNREFUSED from frontend**:

This usually means:
1. **API service is up but frontend can't reach it** → Check API_URL environment variable
2. **Frontend is looking for localhost but API is on container hostname** → This is the LOCAL_DEV fix!
3. **API server is crashed** → Check API logs

```bash
# Verify API is actually responding
curl -v http://localhost:8080/health

# If that fails, check API container
docker compose exec -T grants-api curl http://localhost:8080/health

# If container exec works but localhost doesn't, it's a port mapping issue
docker compose ps | grep grants-api
# Check if ports show 8080:8080 or similar
```

### Phase 1: Start Services
1. Navigate to `/workspaces/simpler-grants-gov`
2. Start all Docker services: `docker compose up -d`
3. Wait 10-15 seconds for initialization
4. Verify all containers running: `docker compose ps`
5. Expected containers: `grants-db`, `grants-api`, `next-dev`, `opensearch`, mock services

### Phase 2: Verify Backend

**API Health Check** (allow 20-30 seconds for startup):
```bash
curl http://localhost:8080/health
```
Expected: `{"status":"ok"}` with HTTP 200

**Test Users Endpoint - Get Mock Users with JWT Tokens**:
```bash
curl http://localhost:8080/local/local-users | jq '.'
```
Expected response format:
```json
[
  {
    "email": "test-user-1@example.com",
    "id": "user-uuid-1",
    "name": "Test User 1",
    "jwt_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  ...
]
```

**Inspect JWT Token Details**:
```bash
# Get a token from the mock users
TOKEN=$(curl -s http://localhost:8080/local/local-users | jq -r '.[0].jwt_token')

# Decode the JWT header and payload (note: token is NOT encoded in local mode)
echo $TOKEN | jq -R 'split(".") | .[1] | @base64d | fromjson'
```
Expected claims: `email`, `sub` (user ID), `iat` (issued at)

**Verify Database is Ready**:
```bash
# Check if database is accepting connections
docker compose exec -T grants-db psql -U postgres -c "SELECT version();"
```

**Check for Backend Errors**:
```bash
docker compose logs grants-api 2>&1 | grep -i "error\|exception\|failed" | head -20
```

**Verify Data is Seeded** (216 opportunities, 202 indexed in OpenSearch):
```bash
# Check if opportunities are in database
docker compose exec -T grants-db psql -U postgres -d grants -c "SELECT COUNT(*) FROM opportunities;"
# Expected: ~216

# Check OpenSearch index
curl http://localhost:9200/opportunities/_count 2>/dev/null | jq '.'
# Expected: count around 202
```

### Phase 3: Verify Frontend Setup & LOCAL_DEV Environment

**Verify LOCAL_DEV Variable is Set**:
```bash
docker compose exec -T nextjs env | grep LOCAL_DEV
```
Expected output: `LOCAL_DEV=true`

**If LOCAL_DEV is not set, debug the environment detection**:
```bash
# Check what environment variables the frontend sees
docker compose exec -T nextjs env | grep "ENVIRONMENT\|API_URL"
```
Expected:
- `ENVIRONMENT=local`
- `API_URL=http://grants-api:8080` (Docker container network)

**Verify LOCAL_DEV Logic** (should check BOTH localhost AND grants-api):
```bash
# The fix should make LOCAL_DEV computation check:
# ENVIRONMENT === "local" && (API_URL?.includes("localhost") || API_URL?.includes("grants-api"))
grep -A 2 "const LOCAL_DEV" /workspaces/simpler-grants-gov/frontend/src/constants/environments.ts
```
Expected: Logic includes both `localhost` and `grants-api` hostname checks

**If frontend won't compile** (check logs):
```bash
docker compose logs nextjs 2>&1 | grep -i "error\|failed\|compiled" | tail -30
```

**Rebuild frontend if needed**:
```bash
docker compose down nextjs && sleep 2
docker compose up -d nextjs
sleep 30  # Wait for compilation
docker compose logs nextjs 2>&1 | grep "compiled\|ready"
```

### Phase 4: Verify Test User UI & Mock User Selection

**Open Application**:
1. Navigate to: `http://localhost:3000/workspace`
2. Look for test user dropdown in header (left side, below search bar)

**Debug Test User Dropdown (if not visible)**:

**Step 1: Check if LOCAL_DEV component renders**:
```bash
curl -s http://localhost:3000/workspace | grep -i "testuser\|test-user\|dropdown" | head -5
```
If nothing found, component not rendering

**Step 2: Verify backend test-users endpoint is callable from frontend**:
```bash
# Check frontend logs for /local/local-users requests
docker compose logs nextjs 2>&1 | grep "local-users" | tail -10
```
Expected: Successful fetch requests to `/local/local-users`

**Step 3: Check browser console for JavaScript errors**:
```bash
# Open DevTools → Console tab to see any fetch errors
# Look for: "Failed to fetch /local/local-users" or JWT-related errors
```

**Step 4: Verify mock user data loads**:
```bash
# Backend must be returning 10+ test users
USERS=$(curl -s http://localhost:8080/local/local-users | jq 'length')
echo "Number of mock users available: $USERS"
# Expected: 10 or more
```

**Step 5: Test user selection manually**:
1. Once dropdown appears, click it
2. You should see list like:
   - test-user-1@example.com
   - test-user-2@example.com
   - etc.
3. Select a user → JWT token should be set in session
4. Verify token in browser localStorage: Open DevTools → Storage → Cookies/Session (look for session token)

**If dropdown shows but users don't load**:
```bash
# Check if frontend can reach the test-users endpoint
docker compose exec -T nextjs curl http://grants-api:8080/local/local-users
# If this fails, network connectivity issue
```

### Phase 5: Test Form Loading

**Test 1: Baseline Form (Should Work)**:
```
http://localhost:3000/workspace/applications/166b10d3-0682-4466-9374-1a1a7f80de55/form/02e4ca43-30ba-400f-b434-0b519e84afab
```
Expected: Form renders with fields visible (NOT TopLevelError page)

**Test 2: Conditional Schema Form (Tests the if/then/else Fix)**:
```
http://localhost:3000/workspace/applications/3b9f1850-bd7a-4c60-906d-afd32d2d4ee1/form/2fbe75ca-cc3d-40e5-9513-e2a84cff956a
```
Expected: Form renders with fields visible (NOT TopLevelError page)
This form has conditional keywords (`if`, `then`, `else`) in schema - if mergeAllOf doesn't have resolvers, it will fail

**Debug Form Loading Issues**:

**Check for schema processing errors**:
```bash
docker compose logs nextjs 2>&1 | grep "Error processing schema\|Error parsing JSON schema"
```
Expected: No output (no errors)

**If you see "No resolver found for key if"**:
This means the fix isn't applied. Check `/frontend/src/utils/applyForm/applyFormUtils.ts` line 703:
```bash
grep -A 10 "const condensedProperties = mergeAllOf" /workspaces/simpler-grants-gov/frontend/src/utils/applyForm/applyFormUtils.ts | head -15
```
Should show resolvers for `if`, `then`, `else`:
```typescript
resolvers: {
  if: (baseSchema, ifSchema) => baseSchema,
  then: (baseSchema, thenSchema) => baseSchema,
  else: (baseSchema, elseSchema) => baseSchema,
}
```

**If forms show TopLevelError page**:
```bash
# Get the actual error message
docker compose logs nextjs 2>&1 | grep -B 5 -A 5 "TopLevelError\|Error parsing JSON schema"
```
This will show:
- The form ID that failed
- The specific error message (e.g., "No resolver found for key if")
- The line number in applyFormUtils.ts

**Test with selected user**:
1. Select a mock user from test dropdown (if available)
2. Try loading forms again
3. JWT should now be available in session for personalized form data

### Phase 6: Report Status
Output a verification checklist:
```
✅ Docker services running
✅ API responding on port 8080
✅ Test users endpoint working (returns JWT tokens)
✅ Frontend compiled successfully
✅ LOCAL_DEV=true in frontend environment
✅ Test user dropdown visible and functional
✅ Baseline form loads without TopLevelError
✅ Conditional schema form loads without TopLevelError
✅ No schema processing errors in logs
```

## Detailed Troubleshooting Guide

### Issue 1: Container Won't Start
```bash
# See detailed startup logs
docker compose logs [service-name] 2>&1 | tail -100

# Common services: grants-db, grants-api, next-dev, opensearch, mock-oauth, mock-sqs

# Restart service
docker compose restart [service-name]
```

### Issue 2: API Not Responding (Port 8080)
```bash
# Check if container is actually running
docker compose ps | grep grants-api

# If running, check logs for startup errors
docker compose logs grants-api 2>&1 | grep -i "error\|exception\|traceback" | head -20

# Database might not be ready yet - wait 30 seconds and retry
sleep 30
curl http://localhost:8080/health

# Check database connection from API perspective
docker compose exec -T grants-api flask --app src.app shell -c "from src.api import db; db.engine.execute('SELECT 1')"
```

### Issue 3: Test Users Endpoint Not Working

**Step 1: Verify endpoint exists**:
```bash
curl -v http://localhost:8080/local/local-users 2>&1 | grep -i "< http\|error"
```
Expected: `< HTTP/1.1 200 OK`

**Step 2: If 404 or connection refused**:
```bash
# API might not be fully started
docker compose logs grants-api 2>&1 | grep "Starting\|listening\|ready"

# Check if routes are registered
docker compose exec -T grants-api flask --app src.app routes | grep local-users
```

**Step 3: Check actual response**:
```bash
curl -s http://localhost:8080/local/local-users | jq 'length, .[0]'
# Should show number of users and sample user object with email, id, name, jwt_token
```

### Issue 4: LOCAL_DEV Not Set in Frontend

**Debug the environment**:
```bash
# Check docker-compose has LOCAL_DEV exported
cat /workspaces/simpler-grants-gov/frontend/docker-compose.yml | grep -A 5 "environment:"

# Check what frontend container actually sees
docker compose exec -T nextjs env | grep -i "local\|environment\|api"

# Check if the detection logic is correct in code
grep -B 2 -A 2 "LOCAL_DEV" /workspaces/simpler-grants-gov/frontend/src/constants/environments.ts
```

**Fix: Update environment variable**:
```bash
# Add/update in docker-compose.yml:
# environment:
#   LOCAL_DEV: "true"
#   ENVIRONMENT: "local"
#   API_URL: "http://grants-api:8080"

# Then restart
docker compose restart nextjs
sleep 5
docker compose exec -T nextjs env | grep LOCAL_DEV
```

### Issue 5: Test User Dropdown Not Visible

**Debug checklist**:
```bash
# 1. Is LOCAL_DEV=true?
docker compose exec -T nextjs env | grep LOCAL_DEV

# 2. Is backend returning users?
curl http://localhost:8080/local/local-users | jq 'length'

# 3. Can frontend reach backend?
docker compose exec -T nextjs curl http://grants-api:8080/local/local-users | jq 'length'

# 4. Is TestUserSelect component rendered?
curl -s http://localhost:3000/workspace | grep -i "testuser"

# 5. Check frontend logs for errors
docker compose logs nextjs 2>&1 | grep -i "error\|warning" | tail -20
```

**Common fixes**:
```bash
# Hard refresh browser (clear cache)
# Ctrl+Shift+R (Windows/Linux) or Cmd+Shift+R (Mac)

# Rebuild frontend
docker compose down nextjs
docker compose up -d nextjs
sleep 30
```

### Issue 6: TopLevelError on Form Load

**Step 1: Identify exact error**:
```bash
# Load failing form URL, then check logs immediately
docker compose logs nextjs 2>&1 | grep "Error processing schema\|Error parsing JSON schema" | head -5
```

**Step 2: If "No resolver found for key if"**:
```bash
# The conditional schema fix isn't applied
# Verify mergeAllOf call has resolvers in applyFormUtils.ts

grep -A 15 "const condensedProperties = mergeAllOf" \
  /workspaces/simpler-grants-gov/frontend/src/utils/applyForm/applyFormUtils.ts

# Should show resolvers object:
# resolvers: {
#   if: (baseSchema, ifSchema) => baseSchema,
#   then: (baseSchema, thenSchema) => baseSchema,
#   else: (baseSchema, elseSchema) => baseSchema,
# }

# If missing, rebuild frontend:
docker compose down nextjs && docker compose up -d nextjs && sleep 30
```

**Step 3: If different error**:
```bash
# Get full error details
docker compose logs nextjs 2>&1 | grep -B 10 -A 10 "Error parsing JSON schema" | head -30

# This will show:
# - Form ID that failed
# - Error message
# - Stack trace pointing to exact line
```

### Issue 7: Database Not Ready

```bash
# Check database container status
docker compose ps | grep grants-db

# Check database logs
docker compose logs grants-db 2>&1 | tail -20

# Test connection manually
docker compose exec -T grants-db psql -U postgres -c "SELECT 1;"

# Check if opportunities data is loaded
docker compose exec -T grants-db psql -U postgres -d grants -c "SELECT COUNT(*) FROM opportunities;"
```

### Issue 8: Mock Services Not Working

```bash
# Check mock-oauth
docker compose logs mock-oauth 2>&1 | tail -20

# Check mock-sqs  
docker compose logs mock-sqs 2>&1 | tail -20

# Check mock SOAP services
docker compose logs mock-soap-services 2>&1 | tail -20

# Verify they're reachable
curl http://localhost:5000/health 2>/dev/null  # mock-oauth
curl http://localhost:9324 2>/dev/null         # mock-sqs
```

### Emergency Full Restart
```bash
# If all else fails, full reset
docker compose down
sleep 5
docker compose up -d
sleep 30

# Then run through verification phases again
```

## Key File References

| File | Purpose | Critical Line(s) |
|------|---------|-----------------|
| `/frontend/src/constants/environments.ts` | LOCAL_DEV detection | Checks both `localhost` and `grants-api` |
| `/frontend/src/utils/applyForm/applyFormUtils.ts` | Form schema processing | Line 703 - mergeAllOf with conditional resolvers |
## Generating Test Data

### Pre-loaded Data
The application automatically loads test data when services start:
- **Opportunities**: 216 opportunities seeded in database
- **OpenSearch Index**: 202 opportunities indexed and searchable
- **Mock Users**: 10+ test users with JWT tokens available at `/local/local-users`

### Manual Data Loading (if needed)

**Verify data is loaded**:
```bash
# Check opportunities in database
docker compose exec -T grants-db psql -U postgres -d grants -c "SELECT COUNT(*) FROM opportunities;"
# Expected: 216

# Check opportunities in OpenSearch
curl http://localhost:9200/opportunities/_count 2>/dev/null | jq '.count'
# Expected: ~202
```

**Re-load data (if it's missing)**:
```bash
# Access the API CLI
docker compose exec -T grants-api flask --app src.app --help

# List available commands
docker compose exec -T grants-api flask --app src.app seed-data --help
# or
docker compose exec -T grants-api flask --app src.app load-search-data --help

# Load opportunities data
docker compose exec -T grants-api flask --app src.app load-search-data

# Load into OpenSearch
docker compose exec -T grants-api flask --app src.app seed-data
```

**Inspect test data in database**:
```bash
# List sample opportunities
docker compose exec -T grants-db psql -U postgres -d grants -c \
  "SELECT id, title, agency_name LIMIT 5;"

# Check user table
docker compose exec -T grants-db psql -U postgres -d grants -c \
  "SELECT COUNT(*) FROM users;"

# Check form data
docker compose exec -T grants-db psql -U postgres -d grants -c \
  "SELECT COUNT(*) FROM forms;"
```

**Mock Test Users Available**:
```bash
# Get full list with emails and user IDs
curl -s http://localhost:8080/local/local-users | jq '.[] | {email, id, name}'

# Get a specific user's JWT token
curl -s http://localhost:8080/local/local-users | jq '.[0] | {email, jwt_token}'

# Decode the JWT to inspect claims
TOKEN=$(curl -s http://localhost:8080/local/local-users | jq -r '.[0].jwt_token')
echo "Token: $TOKEN"
# JWT in local mode is not encoded - just base64
echo $TOKEN | jq -R 'split(".") | .[1] | @base64d | fromjson'
```

## Quick Reference: Key Fixes & How They Work

### Fix 1: Test User Dropdown + Mock Users + JWT Tokens

**Problem**: Dropdown didn't render in Docker containers

**Files Modified**:
- `/frontend/src/constants/environments.ts` - LOCAL_DEV detection
- `/frontend/docker-compose.yml` - Environment variables

**How it works**:
```
1. Frontend docker-compose sets: API_URL=http://grants-api:8080, LOCAL_DEV=true
2. environments.ts detects local dev by checking:
   - ENVIRONMENT === "local" AND
   - (API_URL includes "localhost" OR API_URL includes "grants-api")
3. When LOCAL_DEV is "true", Layout.tsx calls getTestUsers()
4. getTestUsers() fetches from /local/local-users endpoint
5. Backend returns array of mock users with JWT tokens
6. Header component renders TestUserSelect dropdown
7. User selects a test user → JWT token stored in session
8. All subsequent API calls use that JWT for authentication
```

**Debugging**:
```bash
# Step 1: Verify LOCAL_DEV is true
docker compose exec -T nextjs env | grep LOCAL_DEV

# Step 2: Verify backend returns users
curl http://localhost:8080/local/local-users | jq '.'

# Step 3: Verify frontend fetches users
docker compose logs nextjs 2>&1 | grep "local-users"

# Step 4: Check browser for dropdown element
curl -s http://localhost:3000/workspace | grep -i "testuser" 
```

### Fix 2: Form Schema Processing with Conditional Keywords

**Problem**: Forms with `if`, `then`, `else` keywords showed TopLevelError

**File Modified**:
- `/frontend/src/utils/applyForm/applyFormUtils.ts` line 703-714

**How it works**:
```
1. Form schema from backend has conditional keywords: if/then/else
2. processFormSchema() needs to flatten properties using mergeAllOf()
3. mergeAllOf() didn't have resolvers for conditional keywords → ERROR
4. Solution: Provide resolvers that preserve the base schema:
   - if: pass through base schema
   - then: pass through base schema  
   - else: pass through base schema
5. Forms now load successfully without TopLevelError
```

**The Code Fix**:
```typescript
const condensedProperties = mergeAllOf({
  properties: propertiesWithoutComplexConditionals,
} as JSONSchema7, {
  resolvers: {
    if: (baseSchema, ifSchema) => baseSchema,
    then: (baseSchema, thenSchema) => baseSchema,
    else: (baseSchema, elseSchema) => baseSchema,
  }
});
```

**Debugging**:
```bash
# Check if forms load
curl http://localhost:3000/workspace/applications/3b9f1850-bd7a-4c60-906d-afd32d2d4ee1/form/2fbe75ca-cc3d-40e5-9513-e2a84cff956a

# Check for resolver errors
docker compose logs nextjs 2>&1 | grep "No resolver found"
# Should be empty if fix is applied

# Verify resolvers in code
grep -A 8 "resolvers: {" /workspaces/simpler-grants-gov/frontend/src/utils/applyForm/applyFormUtils.ts | grep -A 5 "if:"
```

## Output Format

When the skill completes, provide:
1. **Services Status** - Container health and status
2. **API Connectivity** - Endpoint responses and HTTP codes
3. **Frontend Configuration** - LOCAL_DEV value and compilation status
4. **Form Loading Tests** - Results for both test forms
5. **Log Summary** - Any errors or warnings found
6. **Verification Checklist** - All checks passed/failed
7. **Next Steps** - Any recommendations or fixes needed

If any step fails, immediately suggest the fix and offer to implement it.

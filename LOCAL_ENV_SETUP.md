# Local Environment Setup Guide

## Quick Start (Future Reference)

### Step 1: Pull the Branch
```bash
git checkout bhavna/Local-Env
git pull
```

### Step 2: Run the Skill
In VS Code chat, type:
```
/start-local-environment
```

The skill will automatically guide you through all 6 verification phases and set up your local environment.

---

## What This Branch Contains

This branch (`bhavna/Local-Env`) includes all the fixes needed for local development:

### Code Fixes
- ✅ **LOCAL_DEV Detection** - Detects local environment and enables test UI
- ✅ **Form Schema Processing** - Handles conditional JSON schema keywords
- ✅ **Enhanced Logging** - Better error messages for debugging
- ✅ **Environment Configuration** - Proper Docker networking setup

### Skill File
- ✅ **Interactive Setup Guide** - `.github/skills/start-local-environment/SKILL.md`
  - 6 verification phases with step-by-step commands
  - 55+ debugging commands for troubleshooting
  - Error pattern recognition
  - Data verification and inspection

---

## What the Skill Does

When you run `/start-local-environment`, it will:

1. **Pre-Phase**: Check Docker and initial connectivity
2. **Phase 1**: Start all Docker services
3. **Phase 2**: Verify backend API, JWT tokens, and test users
4. **Phase 3**: Verify frontend LOCAL_DEV environment
5. **Phase 4**: Test user dropdown rendering
6. **Phase 5**: Test form loading (standard + conditional schemas)
7. **Phase 6**: Report comprehensive status

---

## Key Files in This Branch

| File | Purpose |
|------|---------|
| `.github/skills/start-local-environment/SKILL.md` | Complete setup and debugging guide |
| `frontend/docker-compose.yml` | LOCAL_DEV=true environment variable |
| `frontend/src/constants/environments.ts` | LOCAL_DEV detection logic (grants-api hostname) |
| `frontend/src/utils/applyForm/applyFormUtils.ts` | Form schema conditional keyword resolvers |
| `frontend/src/utils/getFormData.ts` | Enhanced error logging |

---

## Troubleshooting

If something doesn't work:

1. **Run the skill again**: `/start-local-environment`
   - It has 8 detailed troubleshooting sections
   - 55+ debugging commands
   - Common error patterns with fixes

2. **Common Issues**:
   - `ECONNREFUSED` → Backend not responding (see Pre-Phase)
   - `TopLevelError` → Form schema issue (see Phase 5 debugging)
   - Test dropdown missing → LOCAL_DEV not set (see Phase 3)
   - No mock users → Backend endpoint not responding (see Phase 2)

---

## Requirements

- Docker and Docker Compose running
- VS Code with GitHub Copilot installed
- This branch checked out (`bhavna/Local-Env`)

---

## Next Time

```bash
# 1. Switch to this branch
git checkout bhavna/Local-Env

# 2. Run the setup skill
# In VS Code chat, type: /start-local-environment

# That's it! The skill guides you through everything else.
```

---

## Technical Details

See `.github/skills/start-local-environment/SKILL.md` for:
- How the LOCAL_DEV fix works
- How the form schema fix works
- Environment variable setup details
- Error pattern documentation
- Test data verification procedures

---

## 📚 Environment Variables Guide

For detailed information on all environment variables, see **[ENV_VARIABLES.md](ENV_VARIABLES.md)**:

### Quick Checklist:
- [ ] `frontend/.env.development` has `ENVIRONMENT=local`
- [ ] `frontend/.env.development` has `API_URL=http://grants-api:8080` (for Docker)
- [ ] `frontend/docker-compose.yml` has `LOCAL_DEV: "true"` 
- [ ] `frontend/docker-compose.yml` has `API_URL: "http://grants-api:8080"`
- [ ] `api/.env` has correct database credentials

### Why Each Matters:
- **ENVIRONMENT=local** + **API_URL with grants-api** → Enables LOCAL_DEV detection
- **LOCAL_DEV: "true"** → Test user dropdown renders
- **API_URL: http://grants-api:8080** → Frontend can reach backend in Docker

### Common Fixes:
1. **Test dropdown missing?** → Check `LOCAL_DEV: "true"` in docker-compose
2. **Can't connect to API?** → Check `API_URL=http://grants-api:8080` (not localhost)
3. **Wrong environment being used?** → Check `ENVIRONMENT=local` in .env.development

See **ENV_VARIABLES.md** for complete documentation and troubleshooting.

---

## 📝 Create a Pull Request

To create a PR with these changes, visit:
```
https://github.com/HHS/simpler-grants-gov/pull/new/bhavna/Local-Env
```

Or compare with main:
```
https://github.com/HHS/simpler-grants-gov/compare/main...bhavna/Local-Env
```

The branch is ready for review and testing! 🚀

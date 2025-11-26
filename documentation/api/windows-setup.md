# Windows Setup Guide for API Development

This guide will help you set up the Simpler Grants.gov API for local development on Windows using WSL (Windows Subsystem for Linux) and Docker Desktop.

## Quick Start Summary

1. Install WSL 2 with Ubuntu (not docker-desktop)
2. Install Docker Desktop and enable Ubuntu integration
3. Install `make` and `postgresql-client` in Ubuntu
4. Navigate to the `api` directory
5. Fix shell script line endings: `sed -i 's/\r$//' bin/*.sh && chmod +x bin/*.sh`
6. Run `make init` (takes 5-10 minutes first time)
7. Run `make start`
8. Verify with `curl http://localhost:8080/health`

See detailed steps below.

## Prerequisites

### 1. Install WSL 2 with Ubuntu

**Important:** This setup requires **Ubuntu** as your WSL 2 distribution. The `docker-desktop` distribution will not work for this setup.

If you don't already have WSL 2 with Ubuntu installed:

1. Open PowerShell as Administrator
2. Run:
   ```powershell
   wsl --install -d Ubuntu
   ```
   Or if WSL 2 is already installed but you don't have Ubuntu:
   ```powershell
   wsl --install Ubuntu
   ```
3. Restart your computer when prompted (if this is a fresh WSL installation)
4. After restart, complete the Ubuntu setup by creating a username and password

**Verify your WSL distributions:**
```powershell
wsl --list --verbose
```

You should see Ubuntu listed. If you only see `docker-desktop`, you need to install Ubuntu separately.

### 2. Install Docker Desktop for Windows

1. Download Docker Desktop from [https://www.docker.com/products/docker-desktop/](https://www.docker.com/products/docker-desktop/)
2. Install Docker Desktop
3. During installation, ensure "Use WSL 2 based engine" is checked
4. After installation, open Docker Desktop
5. Go to **Settings** → **Resources** → **WSL Integration**
6. **Important:** Enable integration with **Ubuntu** (not docker-desktop)
   - Check the box next to "Ubuntu" to enable it
   - You can leave docker-desktop disabled
7. Click **Apply & Restart**

**Note:** The docker-desktop WSL distribution is not compatible with this setup. You must use Ubuntu.

### 3. Verify Docker Installation

Open your **Ubuntu** WSL terminal (you can launch it from the Start menu, search for "Ubuntu", or by typing `wsl -d Ubuntu` in PowerShell) and verify Docker is working:

```bash
docker --version
docker compose version
```

You should see version numbers for both commands.

**If Docker commands don't work:**
- Ensure Docker Desktop is running
- Verify Ubuntu is enabled in Docker Desktop's WSL Integration settings
- Try restarting Docker Desktop

### 4. Install Required Tools

The project uses Makefiles and requires PostgreSQL client tools. Install them in WSL:

```bash
sudo apt update
sudo apt install -y make postgresql-client
```

**Note:** `postgresql-client` is required for database initialization scripts to work properly.

## Setup Steps

### 1. Navigate to the Project Directory

**Important:** Make sure you're using the **Ubuntu** WSL terminal, not docker-desktop. You can launch Ubuntu from the Start menu or use:
```powershell
wsl -d Ubuntu
```

In your Ubuntu WSL terminal, navigate to the API directory. The exact path depends on where you cloned the repository.

**Option 1: Using Windows path (if your project is on C: drive)**
```bash
cd /mnt/c/Users/"YourUsername"/Documents/GitHub/simpler-grants-gov/api
```
Replace `YourUsername` with your Windows username. If your username has spaces, use quotes around it.

**Option 2: Using WSL home directory (if you cloned in WSL)**
```bash
cd ~/simpler-grants-gov/api
```

**Option 3: Find your project location**
```bash
# In PowerShell, find your project:
# cd "C:\Users\YourUsername\Documents\GitHub\simpler-grants-gov"
# Then in WSL, convert the path by replacing:
# C:\Users\YourUsername\... becomes /mnt/c/Users/YourUsername/...
# Example: /mnt/c/Users/YourUsername/Documents/GitHub/simpler-grants-gov/api
```

**Note:** 
- WSL mounts Windows drives under `/mnt/`. The `C:` drive becomes `/mnt/c/`
- Use quotes around paths with spaces
- You can also access Windows files from WSL using the `/mnt/` prefix

### 2. Fix Shell Script Line Endings (Important!)

**Important:** If you cloned the repository on Windows, the shell scripts may have Windows line endings (CRLF) which will cause errors in WSL. Fix them before proceeding:

```bash
# Fix line endings for all shell scripts
sed -i 's/\r$//' bin/*.sh

# Make scripts executable
chmod +x bin/*.sh
```

### 3. Initialize the Development Environment

Run the initialization command which will:
- Generate environment override files with JWT keys (`override.env`)
- Build Docker images (grants-api and opensearch-node)
- Set up the PostgreSQL database with migrations
- Initialize OpenSearch
- Set up LocalStack (S3 mock) with required buckets
- Initialize mock SOAP services
- Initialize mock OAuth2 server

```bash
make init
```

This may take several minutes the first time as it downloads and builds Docker images (expect 5-10 minutes).

**What to expect:**
- The script will create `override.env` with generated JWT keys
- Docker images will be built (this is the longest step)
- Database will be initialized and migrations will run
- All supporting services will start

**Note:** If you see errors about `pg_isready: command not found`, ensure you installed `postgresql-client` in step 4 of prerequisites. The database will still start, but the wait script won't work properly without it.

### 4. Start the API Services

After initialization completes, start all services:

```bash
make start
```

Or to start and watch the logs:

```bash
make run-logs
```

### 5. Verify Services are Running

Check that all containers are running:

```bash
docker compose ps
```

You should see 6 containers with status "Up":
- `grants-api` (the main API) - port 8080
- `grants-db` (PostgreSQL database) - port 5432
- `opensearch-node` (search engine) - port 9200
- `localstack-main` (S3 mock) - port 4566
- `api-mock-oauth2-server-1` (authentication mock) - port 5001
- `mock-applicants-soap-api` (SOAP API mock) - port 8082

If any containers show "Exited" or errors, check the logs:
```bash
docker compose logs <container-name>
```

### 6. Verify API is Accessible

Test that the API is responding:

```bash
# Check health endpoint (should return JSON with status info)
curl http://localhost:8080/health

# Or test the docs endpoint (should return HTTP 200)
curl -I http://localhost:8080/docs
```

You should see a JSON response from the health endpoint. If you get connection errors, wait a few seconds for the API container to fully start, then try again.

**Alternative:** Open in your browser:
- Health: http://localhost:8080/health
- API Documentation: http://localhost:8080/docs

### 7. Seed the Database (Optional but Recommended)

To populate the database with sample data:

```bash
make setup-api-data
```

This will:
- Seed the database with sample opportunities and agencies
- Populate the OpenSearch index with searchable data

### 8. Access the API

Once everything is running, you can access:

- **API**: http://localhost:8080
- **API Documentation (Swagger)**: http://localhost:8080/docs
- **OpenSearch**: http://localhost:9200
- **Mock OAuth2 Server**: http://localhost:5001

## Common Commands

### View Logs

```bash
# View all logs
docker compose logs

# View logs for a specific service
docker compose logs grants-api

# Follow logs in real-time
docker compose logs -f grants-api
```

### Stop Services

```bash
make stop
```

### Restart Services

```bash
make stop
make start
```

### Rebuild Everything

If you need to completely reset your environment:

```bash
make remake-backend
```

**Warning:** This will delete all data in your local database and search index.

### Run Tests

```bash
# Run all tests
make test

# Run specific tests
make test args="tests/src/api/users/test_user_route_login.py"
```

### Access the Database

```bash
# Connect to the database using psql
make login-db

# Or use docker exec
docker exec -it grants-db psql -U app -d app
```

### Access the API Container Shell

```bash
make login
```

## Troubleshooting

### Docker Desktop Not Starting

1. Ensure WSL 2 is installed and updated: `wsl --update`
2. Restart Docker Desktop
3. Check Windows features: Ensure "Virtual Machine Platform" and "Windows Subsystem for Linux" are enabled

### Port Already in Use

If you get errors about ports being in use:

1. Check what's using the port:
   ```bash
   # In PowerShell (not WSL)
   netstat -ano | findstr :8080
   ```
2. Stop the conflicting service or change the port in `docker-compose.yml`

### Shell Script Errors (Line Endings)

If you see errors like `/usr/bin/env: 'bash\r': No such file or directory`:

```bash
# Fix line endings
sed -i 's/\r$//' bin/*.sh
chmod +x bin/*.sh
```

### Database Connection Issues

If the database isn't ready:

```bash
# Check database logs
docker logs grants-db

# Wait for database to be ready
make start-db
```

If you see `pg_isready: command not found` errors, install postgresql-client:

```bash
sudo apt install -y postgresql-client
```

### Wrong WSL Distribution

If you're using `docker-desktop` instead of Ubuntu, you'll encounter errors. The docker-desktop distribution is not compatible with this setup.

**Solution:**
1. Install Ubuntu if you don't have it:
   ```powershell
   wsl --install Ubuntu
   ```
2. Open Docker Desktop → Settings → Resources → WSL Integration
3. Enable Ubuntu (check the box)
4. Disable docker-desktop (uncheck the box)
5. Restart Docker Desktop
6. Always use Ubuntu terminal: `wsl -d Ubuntu` or launch "Ubuntu" from Start menu

**Verify you're using Ubuntu:**
```bash
# In your WSL terminal, check the distribution
cat /etc/os-release | grep NAME
# Should show Ubuntu, not docker-desktop
```

### Permission Issues

If you encounter permission errors:

1. Ensure Docker Desktop has WSL integration enabled for **Ubuntu** (not docker-desktop)
2. Try running commands with explicit user/UID:
   ```bash
   make build user=your-username uid=$(id -u)
   ```

### Slow Performance

If Docker is slow in WSL:

1. Ensure you're using WSL 2 (not WSL 1): `wsl --list --verbose`
2. If using WSL 1, convert to WSL 2: `wsl --set-version <distro-name> 2`
3. Increase Docker Desktop memory allocation in Settings → Resources → Advanced

### Reset Everything

If you need to start completely fresh:

```bash
# Stop all containers and remove volumes
make clean-volumes

# Reinitialize
make init

# Seed data
make setup-api-data
```

## File Path Considerations

When working with Windows and WSL:

- **Windows paths**: `C:\Users\YourUsername\Documents\...`
- **WSL paths**: `/mnt/c/Users/YourUsername/Documents/...`

**Path conversion rules:**
- Replace `C:\` with `/mnt/c/`
- Replace backslashes `\` with forward slashes `/`
- Use quotes around paths with spaces: `"Your Username"`

The project files are shared between Windows and WSL, so you can:
- Edit files in Windows using your preferred editor (VS Code, etc.)
- Run commands in WSL terminal
- Changes are immediately visible in both environments

## Next Steps

- Read the [API README](../../api/README.md) for more information about the application structure
- Check [Development Documentation](./development.md) for development workflows
- Review [API Technical Overview](./technical-overview.md) for architecture details

## Getting Help

If you encounter issues not covered here:

1. Check the [main development documentation](./development.md)
2. Review Docker logs: `docker compose logs`
3. Check the [troubleshooting section](#troubleshooting) above
4. Review the project's [CONTRIBUTING.md](../../CONTRIBUTING.md) for community guidelines


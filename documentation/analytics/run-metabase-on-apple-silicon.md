# Running Metabase Locally with Docker on Apple Silicon

This guide provides instructions for building and running Metabase locally 
using Docker on a Mac with Apple Silicon (M1/M2/M3). 

## Prerequisites

This guide assumes you have the following installed:

- [Docker Desktop](https://www.docker.com/products/docker-desktop/)
- [Docker Compose](https://docs.docker.com/compose/install/)

## 1. Create a Custom Metabase Dockerfile

Create a directory named `metabase` in your project root if it doesn't already 
exist:

```bash
cd simpler-grants-gov/analytics/
mkdir -p metabase
cd metabase
```

Inside the `metabase` directory, create a `Dockerfile` with the following 
content:

```Dockerfile
FROM openjdk:17-slim

ENV MB_VERSION=v0.46.6.1
ENV MB_HOME=/app

WORKDIR $MB_HOME

RUN apt-get update && \
    apt-get install -y wget unzip && \
    wget https://downloads.metabase.com/$MB_VERSION/metabase.jar && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

EXPOSE 3000

CMD ["java", "-jar", "metabase.jar"]
```

## 2. Modify `docker-compose.yml`

In `docker-compose.yml`, update setting for the `grants-metabase` service 
to use the custom Dockerfile (created in the previous step) and support 
ARM64 architecture.

```yaml
  grants-metabase:
    build:
      context: ./metabase
      dockerfile: Dockerfile
    platform: linux/arm64
    container_name: grants-metabase
    ports:
      - "3100:3000"
    env_file: ./local.env
    volumes:
      - /dev/urandom:/dev/random:ro
```

The new settings tell Docker to build the image locally for the ARM64 
platform required on Apple Silicon chips.

## 3. Confirm Environment Configuration

Ensure the `local.env` file includes DB and Metabase values that match 
the respective service names in `docker-compose.yml` (see previous step). 

```env
# EXCERPT FROM local.env
DB_HOST=grants-analytics-db
MB_DB_HOST=grants-analytics-db
```

## 4. Build and Start the Containers

Run the following commands to set up the services:

### A. Stop any running services:

```bash
docker compose down
```

### B. Build Metabase image for ARM64:

```bash
docker compose build --no-cache grants-metabase
```

### C. Start all services:

```bash
docker compose up -d
```

## 5. Access Metabase

Confirm that Metabase launched successfully by tailing the logs and looking 
for healthy signals:

```bash
docker compose logs -f grants-metabase
```

Look for the following string (or similar):
```bash
Launching Embedded Jetty Webserver with config
```

If you see that message or similar, the Metabase app should be available
in a web browser at [http://localhost:3100](http://localhost:3100).

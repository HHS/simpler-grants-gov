# Quickstart Development Guide for Newcomers

This Quickstart file is intended to help newcomers get SimplerGrants setup as easily as possible. Sections include setting up to run only the Frontend, the API, and Full Stack (both Frontend and API).

Prior to following any of the sections below, ensure you have forked SimplerGrants and cloned your fork.

## Frontend Prerequisites

- Node ([check for version in .nvmrc](./frontend/.nvmrc))

## API Prerequisites

- Docker (with docker compose plugin)
- Make
- Git (should already be installed)

## Frontend-Only

The Frontend can be easily setup locally if you intend to work on Frontend Issues. To see further information, such as running the Frontend with Docker, read [here](./documentation/frontend/development.md).

Ensure you have the [Frontend Preqs](#frontend-prerequisites) installed before proceeding.

1. Navigate to the Frontend Directory

```bash
cd frontend/
```

2. Install Node Packages

```bash
npm install
```

3. Run the Frontend Only (will be available at [`localhost:3000`](http://localhost:3000/))

```bash
npm run local
```

## API-Only

The API can be run without the Frontend if you intend to work on API issues. For more information on API Development Setup, you can read [here](./documentation/api/development.md).

Ensure you have the [API Preqs](#api-prerequisites) installed before proceeding.

1. Navigate to the API Directory

```bash
cd api/
```

2. Start the local containers

```bash
make init
```

3. Fill up the database with local data

```bash
make setup-api-data
```

4. Start API with logs (API will be available at [`localhost:8080`](http://localhost:8080/))

```bash
make run-logs
```

## Full Stack (Frontend and API)

Run the API steps from the [API-Only](#api-only) section first.

Then, from the `frontend/` directory run:

```bash
npm run local
```

Or, if you have **Docker installed**, you can run:

```bash
make dev
```

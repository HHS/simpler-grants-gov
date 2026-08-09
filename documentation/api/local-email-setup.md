
# Local Email Setup

This guide explains how to send and receive emails locally during development without using a real email provider.

## Overview

For local development, we use [Mailpit](https://mailpit.axllent.org/) as a local SMTP server and email inbox viewer. Mailpit captures all outgoing emails so you can inspect them without sending real emails.

## Prerequisites

- Docker and Docker Compose installed
- Local development environment set up (see [development.md](development.md))

## Setup

### 1. Start Mailpit via Docker Compose

Mailpit is included in the local Docker Compose configuration. Start it along with the other services:

```bash
make start
```

Or start Mailpit directly:

```bash
docker compose up mailpit
```

### 2. Configure Environment Variables

In your local `.env` file, set the following SMTP configuration to point to Mailpit:

```env
# Local email configuration (Mailpit)
SMTP_HOST=localhost
SMTP_PORT=1025
SMTP_SSL=false
SMTP_USER=
SMTP_PASSWORD=
```

> **Note:** Mailpit does not require authentication for local use.

### 3. View Captured Emails

Open your browser and navigate to the Mailpit web UI:

```
http://localhost:8025
```

All emails sent by the application will appear here. You can:
- View HTML and plain-text versions of emails
- Inspect email headers
- Check attachments
- Delete individual emails or clear the inbox

## How It Works

When the application sends an email (e.g., registration confirmation, password reset), it connects to the local SMTP server on port `1025`. Mailpit intercepts the message and stores it in memory, making it available in the web UI on port `8025`. No email is ever delivered to a real inbox.

## Ports

| Service | Port | Description |
|---------|------|-------------|
| Mailpit SMTP | 1025 | SMTP server for sending emails |
| Mailpit Web UI | 8025 | Browser-based inbox viewer |

## Troubleshooting

### Emails not appearing in Mailpit

1. Confirm Mailpit is running:
   ```bash
   docker compose ps mailpit
   ```
2. Verify your `.env` file has `SMTP_HOST=localhost` and `SMTP_PORT=1025`.
3. Check application logs for SMTP connection errors:
   ```bash
   docker compose logs api
   ```

### Port conflicts

If port `1025` or `8025` is already in use on your machine, update the port mappings in `docker-compose.yml` and adjust your `.env` accordingly.

### Emails sent in tests

Unit and integration tests should mock the email service rather than connecting to Mailpit. See [writing-tests.md](writing-tests.md) for guidance on mocking external services.

## Additional Resources

- [Mailpit Documentation](https://mailpit.axllent.org/docs/)
- [API Development Guide](development.md)
- [Local Seed Data](local-seed-data.md)

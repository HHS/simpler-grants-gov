# Overview

This folder contains any shared resources between our
backend applications which currently consists of our [API](../api)
and [Analytics](../analytics) code.

# Local Postgres Database

The Postgres DB defined in [docker-compose.db.yml](docker-compose.db.yml) is
shared by each of our backend services. For further information on how it works,
please see [database-management.md](../documentation/api/database/database-management.md)
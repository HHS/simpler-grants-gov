# Maintenances and Operation of Runtime System

## Scaling

All scaling options can be found in the following files:

API:

- [infra/api/app-config/dev.tf](infra/api/app-config/dev.tf)
- [infra/api/app-config/staging.tf](infra/api/app-config/staging.tf)
- [infra/api/app-config/prod.tf](infra/api/app-config/prod.tf)

Frontend:

- [infra/frontend/app-config/dev.tf](infra/frontend/app-config/dev.tf)
- [infra/frontend/app-config/staging.tf](infra/frontend/app-config/staging.tf)
- [infra/frontend/app-config/prod.tf](infra/frontend/app-config/prod.tf)

### ECS

Scaling is handled by configuring the following values:

- instance desired instance count
- instance scaling minimum capacity
- instance scaling maximum capacity

Notably, both our API and our frontend scale based on memory usage. This will be revisited over time if it changes.

### Database

Scaling is handled by configuring the following values:

- Database minimum capacity
- Database maximum capacity
- Database instance count

In prod, the database maximum capacity is as high as it goes. Further scaling past the point will require scaling
out the instance count. Effectively using the instance count scaling might require changes to our application layer.

### OpenSearch

- Search master instance type
- Search data instance type
- Search data volume size
- Search data instance count
- Search availability zone count

When scaling openSearch, consider which attribute changes will trigger blue/green deploys, versus which attributes
can be edited in place. [You can find that information here](https://docs.aws.amazon.com/opensearch-service/latest/developerguide/managedomains-configuration-changes.html). Requiring blue/green changes for the average configuration change is a
notable constraint of OpenSearch, relative to ECS and the Database.

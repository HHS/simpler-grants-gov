# Maintenances and Operation of Runtime System

## Deployment

### Updating to our Terraform Version

TODO

### Terraform State Locks

Terraform state locks happen when multiple terraform deployments try to roll out simultaneously.

You can fix them by:

1. Finding the job (via Github Action or otherwise) where the deployment failed. If you aren't sure, then it was probably in a Github Action. You can find a list of failing actions here: https://github.com/HHS/simpler-grants-gov/actions
2. Wait for the deployment that caused the state lock to finish. If you can't find it, just wait 30 minutes.
3. Identify the folder in which the state lock is happening. The `Path` attribute on the `Lock Info` block will identify this.
4. Open up your terminal, setup AWS (eg. `export AWS_PROFILE=grants-bla-bla-bla` && `aws sso login`) and cd into the folder identified above
5. Run `terraform init -backend-config=<ENVIRONMENT>.s3.tfbackend`, where `<ENVIRONMENT>` can be identified by the `Path` above.
6. Run `terraform force-unlock -force <LOCK_ID` where `<LOCK_ID>` is the value of `ID` in your state lock message.

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
- instance CPU
- instance memory

Our ECS instances auto scale based on both memory and CPU. You can view the autoscaling configuration
here: [infra/modules/service/autoscaling.tf](infra/modules/service/autoscaling.tf)

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

## Yearly Rotations

We manage several secret values that need to be rotated yearly.

### Login.gov Certificates

*These certificates were last updated in December 2024*

We need to manage a public certificate with login.gov for [private_jwt_auth](https://developers.login.gov/oidc/token/#client_assertion) in each of our environments.

To generate a certificate run:
```shell
openssl req -nodes -x509 -days 365 -newkey rsa:2048 -keyout private.pem -out public.crt -subj "/C=US/ST=Washington DC/L=Washington DC/O=Nava PBC/OU=Engineering/CN=Simpler Grants.gov/emailAddress=grantsteam@navapbc.com"
```

Navigate to the [login.gov service provider page](https://dashboard.int.identitysandbox.gov/service_providers)
and for each application edit it, and upload the public.crt file. Leave any prior cert files alone until we have
switched the API to using the new one.

Go to SSM parameter store and change the value that maps to the `LOGIN_GOV_CLIENT_ASSERTION_PRIVATE_KEY` value
for the given environment to be the value from the `private.pem` key you generated.

After the next deployment in an environment, we should be using the new keys, and can cleanup the old certificate.

#### Prod Login.gov

Prod login.gov does not update immediately, and you must [request a deployment](https://developers.login.gov/production/#changes-to-production-applications) to get a certificate rotated.

For Prod, assume it will take at least two weeks from creating the certificate, before it is available for the API, and until it is, do not change the API's configured key.

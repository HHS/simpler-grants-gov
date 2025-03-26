# Maintenances and Operation of Runtime System

## Deployment

### Deploying Every Service

This series of commands will deploy non-prod every service for you. Run them from the top level directory (where this file is located). If you want to run them all quickly, then run each block of bash in a new terminal.

```bash
terraform -chdir="infra/api/service" init -backend-config="dev.s3.tfbackend" -reconfigure
terraform -chdir="infra/api/service" apply -var "environment_name=dev"

terraform -chdir="infra/api/service" init -backend-config="staging.s3.tfbackend" -reconfigure
terraform -chdir="infra/api/service" apply -var "environment_name=staging"
```

```bash
terraform -chdir="infra/frontend/service" init -backend-config="dev.s3.tfbackend" -reconfigure
terraform -chdir="infra/frontend/service" apply -var "environment_name=dev"

terraform -chdir="infra/frontend/service" init -backend-config="staging.s3.tfbackend" -reconfigure
terraform -chdir="infra/frontend/service" apply -var "environment_name=staging"
```

```bash
terraform -chdir="infra/analytics/service" init -backend-config="dev.s3.tfbackend" -reconfigure
terraform -chdir="infra/analytics/service" apply -var "environment_name=dev"

terraform -chdir="infra/analytics/service" init -backend-config="staging.s3.tfbackend" -reconfigure
terraform -chdir="infra/analytics/service" apply -var "environment_name=staging"
```

### Updating to our Terraform Version

1. Install `tfenv`
2. Get the terraform version to install from `terraform_version` this file: https://github.com/HHS/simpler-grants-gov/blob/main/.github/workflows/deploy.yml
3. Follow `tfenv` instructions to install and utilize the given terraform version

### Terraform State Locks

Terraform state locks happen when multiple terraform deployments try to roll out simultaneously.

You can fix them on CLI by:

1. Finding the job (via Github Action or otherwise) where the deployment failed. If you aren't sure, then it was probably in a Github Action. You can find a list of failing actions here: https://github.com/HHS/simpler-grants-gov/actions
2. Wait for the deployment that caused the state lock to finish. If you can't find it, just wait 30 minutes.
3. Identify the folder in which the state lock is happening. The `Path` attribute on the `Lock Info` block will identify this.
4. Open up your terminal, setup AWS (eg. `export AWS_PROFILE=grants-bla-bla-bla` && `aws sso login`), and cd into the folder identified above
5. Run `terraform init -backend-config=<ENVIRONMENT>.s3.tfbackend`, where `<ENVIRONMENT>` can be identified by the `Path` above.
6. Run `terraform force-unlock -force <LOCK_ID>` where `<LOCK_ID>` is the value of `ID` in your state lock message.
7. Re-run your deploy job

Sometimes CLI unlock won't work, that will look like (for example) the following error message:

> terraform force-unlock -force <LOCK_ID>
> Failed to unlock state: failed to retrieve lock info for lock ID <LOCK_ID>: unexpected end of JSON input

When that happens, you need to unlock it via DynamoDB in the AWS console.

1. Login to AWS
2. [Open the DynamoDB console](https://us-east-1.console.aws.amazon.com/dynamodbv2/home?region=us-east-1)
3. [Open the tables tab](https://us-east-1.console.aws.amazon.com/dynamodbv2/home?region=us-east-1#tables)
4. Click on the state locks table. There should only be one.
5. Click the `Explore Table Items` button
6. Find the item that corresponds to the currently locked state, you can get that by again looking at the `Path` attribute in your locked job.
7. Remove the `Digest` key, `Save and close`
8. Re-run your deploy job

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

## New Relic

There are three ways to interact with New Relic: UI, CLI, or API. Most interactions will be done via the UI.

### New Relic API via Terraform

We use the New Relic via means of Terraform. [You can via the New Relic Terraform API documentation here](https://registry.terraform.io/providers/newrelic/newrelic/latest/docs/guides/getting_started). To setup Terraform for New Relic, perform the following steps:

1. [Login to New Relic](https://one.newrelic.com)
2. [Navigate to the API keys page](https://one.newrelic.com/admin-portal/api-keys/home)
3. Create a key of key type "user"
4. Copy the key value
5. Set the key value, region,  in your `.zshrc` `.bashrc` or similar:

```bash
export NEW_RELIC_ACCOUNT_ID=1234 # Found in the URL among other places. eg. https://one.newrelic.com/nr1-core?account=< ACCOUNT ID HERE>
export NEW_RELIC_API_KEY="EXAMPLE"
export NEW_RELIC_REGION="US" # Always "US".
```

You will then be able to interact with New Relic via Terraform. There's some New Relic Terraform configuration inside of the `infra/accounts/` folder for example. From this point you can use normal Terraform CLI commands to interact with New Relic, `terraform init` `terraform apply` etc.

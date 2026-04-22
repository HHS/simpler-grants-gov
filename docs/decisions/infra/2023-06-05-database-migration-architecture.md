# Database Migration Infrastructure and Deployment

- Status: accepted
- Deciders: @lorenyu, @daphnegold, @chouinar, @Nava-JoshLong, @addywolf-nava, @sawyerh, @acouch, @SammySteiner
- Date: 2023-06-05

## Context and Problem Statement

What is the most optimal setup for database migrations infrastructure and deployment?
This will break down the different options for how the migration is run, but not the
tools or languages the migration will be run with, which will be dependent on the framework the application is using.

Questions that need to be addressed:

1.  How will the method get the latest migration code to run?
2.  What infrastructure is required to use this method?
3.  How is the migration deployment re-run in case of errors?

## Decision Drivers

- Security
- Simplicity
- Flexibility

## Considered Options

- Run migrations from GitHub Actions
- Run migrations from a Lambda function
- Run migrations from an ECS task
- Run migrations from self-hosted GitHub Actions runners

## Decision Outcome

Run migrations from an ECS task using the same container image that is used for running the web service. Require a `db-migrate` script in the application container image that performs the migration. When running the migration task using [AWS CLI's run-task command](https://docs.aws.amazon.com/cli/latest/reference/ecs/run-task.html), use the `--overrides` option to override the command to the `db-migrate` command.

Default to rolling forward instead of rolling back when issues arise (See [Pitfalls with SQL rollbacks and automated database deployments](https://octopus.com/blog/database-rollbacks-pitfalls)). Do not support rolling back out of the box, but still project teams to easily implement database rollbacks through the mechanism of running an application-specific database rollback script through a general purpose `run-command` script.

Pros

- No changes to the database network configuration are needed. The database can remain inaccessible from the public internet.
- Database migrations are agnostic to the migration framework that the application uses as long as the application is able to provide a `db-migrate` script that is accessible from the container's PATH and is able to use IAM authentication for connecting to the database. Applications can use [alembic](https://alembic.sqlalchemy.org/), [flyway](https://flywaydb.org/), [prisma](https://www.prisma.io/), another migration framework, or custom-built migrations.
- Database migrations use the same application image and task definition as the base application.

Cons

- Running migrations requires doing a [targeted terraform apply](https://developer.hashicorp.com/terraform/tutorials/state/resource-targeting) to update the task definition without updating the service. Terraform recommends against targeting individual resources as part of a normal workflow. However, this is done to ensure migrations are run before the service is updated.

## Other options considered

### Run migrations from GitHub Actions using a direct database connection

Temporarily update the database to be accessible from the internet and allow incoming network traffic from the GitHub Action runner's IP address. Then run the migrations directly from the GitHub Action runner. At the end, revert the database configuration changes.

Pros:

- Simple. Requires no additional infrastructure

Cons:

- This method requires temporarily exposing the database to incoming connections from the internet, which may not comply with agency security policies.

### Run migrations from a Lambda function

Run migrations from an AWS Lambda function that uses the application's container image. The application container image needs to [implement the lambda runtime API](https://aws.amazon.com/blogs/aws/new-for-aws-lambda-container-image-support/) either by using an AWS base image for Lambda or by implementing the Lambda runtime (see [Working with Lambda container images](https://docs.aws.amazon.com/lambda/latest/dg/images-create.html)).

Pros:

- Relatively simple. Lambdas are already used for managing database roles.
- The Lambda function can run from within the VPC, avoiding the need to expose the database to the public internet.
- The Lambda function is separate from the application service, so we avoid the need to modify the service's task definition.

Cons:

- Lambda function container images need to [implement the lambda runtime API](https://aws.amazon.com/blogs/aws/new-for-aws-lambda-container-image-support/). This is a complex application requirement that would significantly limit the ease of use of the infrastructure.
- Lambda functions have a maximum runtime of 15 minutes, which can limit certain kinds of migrations.

### Run migrations from self-hosted GitHub Actions runners

Then run the migrations directly from a [self-hosted GitHub Action runner](https://docs.github.com/en/actions/hosting-your-own-runners/managing-self-hosted-runners/about-self-hosted-runners). Configure the runner to have network access to the database.

Pros

- If a project already uses self-hosted runners, this can be the simplest option as it provides all the benefits of running migrations directly from GitHub Actions without the security impact.

Cons

- The main downside is that this requires maintaining self-hosted GitHub Action runners, which is too costly to implement and maintain for projects that don't already have it set up.

## Related ADRS

- [Separate the database infrastructure into a separate layer](./2023-05-25-separate-database-infrastructure-into-separate-layer.md)
- [Provision database users with serverless function](./2023-05-25-provision-database-users-with-serverless-function.md)

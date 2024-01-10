# Set up application environment

The application environment setup process will:

1. Configure a new application environment and create the infrastructure resources for the application in that environment

## Requirements

Before setting up the application's environments you'll need to have:

1. [A compatible application in the app folder](https://github.com/navapbc/template-infra/blob/main/template-only-docs/application-requirements.md)
2. [Configure the app](/infra/app/app-config/main.tf). Make sure you update `has_database` to `true` or `false` depending on whether or not your application has a database to integrate with.
   1. If you're configuring your production environment, make sure to update the `service_cpu`, `service_memory`, and `service_desired_instance_count` settings based on the project's needs. If your application is sensitive to performance, consider doing a load test.
3. [Create a nondefault VPC to be used by the application](./set-up-network.md)
4. (If the application has a database) [Set up the database for the application](./set-up-database.md)
5. (If you have an incident management service) [Set up monitoring](./set-up-monitoring-alerts.md)
6. [Set up the application build repository](./set-up-app-build-repository.md)

## 1. Configure backend

To create the tfbackend and tfvars files for the new application environment, run

```bash
make infra-configure-app-service APP_NAME=app ENVIRONMENT=<ENVIRONMENT>
```

`APP_NAME` needs to be the name of the application folder within the `infra` folder. It defaults to `app`.
`ENVIRONMENT` needs to be the name of the environment you are creating. This will create a file called `<ENVIRONMENT>.s3.tfbackend` in the `infra/app/service` module directory.

Depending on the value of `has_database` in the [app-config module](/infra/app/app-config/main.tf), the application will be configured with or without database access.

## 2. Build and publish the application to the application build repository

Before creating the application resources, you'll need to first build and publish at least one image to the application build repository.

There are two ways to do this:

1. Trigger the "Build and Publish" workflow from your repo's GitHub Actions tab. This option requires that the `role-to-assume` GitHub workflow variable has already been setup as part of the overall infra account setup process.
1. Alternatively, run the following from the root directory. This option can take much longer than the GitHub workflow, depending on your machine's architecture.

    ```bash
    make release-build APP_NAME=app
    make release-publish APP_NAME=app
    ```

Copy the image tag name that was published. You'll need this in the next step.

## 3. Create application resources with the image tag that was published

Now run the following commands to create the resources, using the image tag that was published from the previous step. Review the terraform before confirming "yes" to apply the changes.

```bash
TF_CLI_ARGS_apply="-var=image_tag=<IMAGE_TAG>" make infra-update-app-service APP_NAME=app ENVIRONMENT=<ENVIRONMENT>
```

## 4. Configure monitoring alerts

Configure email alerts, external incident management service integration and additional Cloudwatch Alerts.
[Configure monitoring module](./set-up-monitoring-alerts.md)


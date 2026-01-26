# Set up application build repository

The application build repository setup process will create infrastructure resources needed to store built release-candidate artifacts used to deploy the application to an environment.

## Requirements

Before setting up the application's build repository you'll need to have:

1. [Set up the AWS account](./set-up-aws-account.md)
2. Configure the app in `infra/<APP_NAME>/app-config/main.tf`.

## 1. Configure backend

To create the `tfbackend` file for the build repository using the backend configuration values from your current AWS account, run

```bash
make infra-configure-app-build-repository APP_NAME=<APP_NAME>
```

Pass in the name of the app folder within `infra`.

## 2. Create build repository resources

Now run the following commands to create the resources, making sure to verify the plan before confirming the apply.

```bash
make infra-update-app-build-repository APP_NAME=<APP_NAME>
```

## 3. Check that the build repository was created properly

Run the [Build and publish GitHub Actions workflow](/.github/workflows/build-and-publish.yml) to build your application's image and publish it to the container image registry you just created. If you have the GitHub CLI installed, you can do this using the following command.

```bash
gh workflow run build-and-publish.yml --field app_name=<APP_NAME> --field ref=main
```

## Set up application environments

Once you set up the deployment process, you can proceed to [set up application environments](./set-up-app-env.md)

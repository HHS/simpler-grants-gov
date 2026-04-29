# Add additional application

The infrastructure supports multiple applications in a monorepo. This section describes how to add an application to the infrastructure.

## 1. Create a new application directory

Create a new directory for your application in the root of the repository. The application needs to meet the [application requirements](https://github.com/navapbc/template-infra/blob/main/template-only-docs/application-requirements.md).

## 2. Add infrastructure code for the new application

[Use the platform CLI to add a new application to the repository](https://github.com/navapbc/platform-cli/blob/main/docs/adding-an-app.md)

## 3. Set up the application infrastructure

Follow the steps in the [infra README](/infra/README.md) to set up the application infrastructure. This includes at a minimum setting up the application build repository, application environments, and depending on your needs it may require setting up separate AWS accounts or virtual networks.

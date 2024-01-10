# Feature flags system design

* Deciders: @aligg @Nava-JoshLong @lorenyu
* Date: 2023-11-28

## Context

All projects should have some sort of feature flag mechanism for controlling the release and activation of features. This accelerates product development by unblocking developers from being able to deploy continuously while still providing business owners with control over when features are visible to end users. More advanced feature flag systems can also provide the ability to do gradual rollouts to increasing percentages of end users and to do split tests (also known as A/B tests) to evaluate the impact of different feature variations on user behavior and outcomes, which provide greater flexibility on how to reduce the risk of launching features. As an example, when working on a project to migrate off of legacy systems, having the ability to slowly throttle traffic to the new system while monitoring for issues in production is critical to managing risk.

## Requirements

1. The project team can define feature flags, or feature toggles, that enable/disable a set of functionality in an environment, depending on whether the flag is enabled or disabled.
2. The feature flagging system should support gradual rollouts, the ability to roll out a feature incrementally to a percentage of users.
3. Separate feature flag configuration from implementation of the feature flags, so that feature flags can be changed frequently through configuration without touching the underlying feature flag infrastructure code.

## Approach

This tech spec explores the use of [AWS CloudWatch Evidently](https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/CloudWatch-Evidently.html), a service that provides functionality for feature flags, gradual rollouts, and conducting split testing (A/B testing) experiments.

## Feature management

One key design question is how features should be managed once defined. How should a team go about enabling and disabling the feature flags and adjusting the percentage of traffic to send to a new feature during a feature launch?

### Option 1. Manage features using app-config module as part of service layer

Define features in [app-config](/infra/app/app-config/), and use that configuration in the [service layer](/infra/app/service/) to create and configure the features in AWS Evidently.

* Everything is defined in code and in one place.
* Feature and feature configurations are updated automatically as part of service deploys or can be done manually via a terraform apply.

The configuration in the app-config module might look something like the following:

```terraform
features = {
  some_disabled_feature = {} // defaults to enabled = false

  some_enabled_feature = {
    enabled = true
  }

  partially_rolled_out_feature = {
    throttle_percentage = 0.2
  }
}
```

### Option 2. Manage features using app-config as part of a separate infrastructure layer

Define features in [app-config](/infra/app/app-config/main.tf). Create the features in the [service layer](/infra/app/service/) but set things like throttle percentages (for gradual rollouts) in a separate infrastructure layer.

* Allows for separation of permissions. For example, individuals can have permission to update feature launch throttle percentages without having permission to create, edit, or delete the features themselves.

### Option 3. Manage features in AWS Console outside of terraform

Define features in [app-config](/infra/app/app-config/main.tf) and create them in the [service layer](/infra/app/service), but set things like throttle percentages (for gradual rollouts) outside of terraform (e.g. via AWS Console). Use `lifecycle { ignore_changes = [entity_overrides] }` in the terraform configuration for the `aws_evidently_feature` resources to ignore settings that are managed via AWS Console.

* Empowers non-technical roles like business owners and product managers to enable and disable feature flags and adjust feature launch throttle percentages without needing to depend on the development team.
* A no-code approach using the AWS Console GUI means that it's possible to leverage the full set of functionality offered by AWS CloudWatch Evidently, including things like scheduled launches, with minimal training and without needing to learn how to do it in code.

A reduced configuration in the app-config module that just defines the features might look something like the following:

```terraform
feature_flags = [
  "some_new_feature_1", "some_new_feature_2"
]
```

## Decision Outcome

Chosen option: "Option 3: Manage features in AWS Console outside of terraform". The ability to empower business and product roles to control launches and experiments without depending on engineering team maximizes autonomy and allows for the fastest delivery.

## Notes on application layer design

The scope of this tech spec is focused on the infrastructure layer, but we'll include some notes on the elements of feature flag management that will need to be handled at the application layer.


### Application layer requirements

1. Client interface with feature flag service — Applications need a client module that captures the feature flag service abstraction. The application code will interface with this module rather than directly with the underlying feature flag service.
2. Local development — Project team developers need a way to create and manage feature flags while developing locally, ideally without dependencies on an external service.

### Application layer design

#### Feature flag module interface

At it's core, the feature flag module needs a function `isFeatureEnabled` that determines whether a feature has been enabled. It needs to accept a feature name, and for gradual rollouts it will also need a user identifier. This is so that the system can remember which variation was assigned to a given user, so that any individual user will have a consistent experience.

```ts
interface FeatureFlagService {
  isFeatureEnabled(featureName: string, userId?: string): boolean
}
```

#### Adapter pattern

The feature flag module should use the adapter pattern to provide different mechanisms for managing feature flags depending on the environment. Deployed cloud environments should use the Amazon CloudWatch Evidently service. Local development environments could use a mechanism available locally, such as environment variables, config files, cookies, or a combination.

```ts
import { EvidentlyClient, EvaluateFeatureCommand } from "@aws-sdk/client-evidently";

class EvidentlyFeatureFlagService implements FeatureFlagService {
  client: EvidentlyClient

  isFeatureEnabled(feature: string, userId?: string): boolean {
    const command = new EvaluateFeatureCommand({
      ...
      feature,
      entityId: userId,
      ...
    });
    const response = await this.client.send(command)
    ...
  }
}
```

```ts
class LocalFeatureFlagService implements FeatureFlagService {

  isFeatureEnabled(feature: string, userId?: string): boolean {
    // check config files, environment variables, and/or cookies
  }
}
```

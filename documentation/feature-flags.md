# Feature flags and partial releases

Feature flags are an important tool that enables [trunk-based development](https://trunkbaseddevelopment.com/). They allow in-progress features to be merged into the main branch while still allowing that branch to be deployed to production at any time, thus decoupling application deploys from feature releases. For a deeper introduction, [Martin Fowler's article on Feature Toggles](https://martinfowler.com/articles/feature-toggles.html) and [LaunchDarkly's blog post on feature flags](https://launchdarkly.com/blog/what-are-feature-flags/) are both great articles that explain the what and why of feature flags.

## How it works

This project leverages [Amazon CloudWatch Evidently](https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/CloudWatch-Evidently.html) to create and manage feature flags.

## Creating feature flags

The list of feature flags for an application is defined in the `feature_flags` property in its app-config module (in `/infra/[app_name]/app-config/main.tf`). To create a new feature flag, add a new string to that list. To remove a feature flag, remove the feature flag from the list. The set of feature flags will be updated on the next terraform apply of the service layer, or during the next deploy of the application.

## Querying feature flags in the application

To determine whether a particular feature should be enabled or disabled for a given user, the application code calls an "is feature enabled" function in the feature flags module. Under the hood, the module will call AWS Evidently's [EvaluateFeature](https://docs.aws.amazon.com/cloudwatchevidently/latest/APIReference/API_EvaluateFeature.html) API to determine whether a feature is enabled or disabled. For partial rollouts, it will remember which variation of the application a particular user saw and keep the user experience consistent for that user. For more information about the feature flags module, look in the application code and docs.

## Managing feature releases and partial rollouts via AWS Console

The system is designed to allow the managing of feature releases and partial rollouts outside of terraform, which empowers business owners and product managers to control enable and disable feature flags and adjust feature launch traffic percentages without needing to depend on the development team.

### To enable or disable a feature

1. Navigate to the Evidently service in AWS Console, select the appropriate Evidently feature flags project for the relevant application environment, and select the feature you want to manage.
2. In the actions menu, select "Edit feature".
3. Under "Feature variations", select either "FeatureOn" (to enable a feature) or "FeatureOff" (to disable a feature) to be the "Default" variation, then submit. **Warning: Do not modify the variation values. "FeatureOn" should always have a value of "True" and "FeatureOff" should always have a value of "False".**

### To manage a partial rollout

1. Navigate to the Evidently service in AWS Console, and select the appropriate Evidently feature flags project for the relevant application environment
2. Select "Create launch" to create a new partial rollout plan, or select an existing launch to manage an existing rollout
3. Under "Launch configuration", choose the traffic percentage you want to send to each variation, and choose whether you want the launch to begin immediately or on a schedule.

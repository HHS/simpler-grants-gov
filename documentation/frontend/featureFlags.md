# Background

Simpler Grants maintains a feature flag system within its NextJS app that currently allows for custom behavior on pages and features. Each feature flag is a simple boolean, and when turned on (or turned to `true`), a page or feature that is set up to respond to this flag can opt out of the standard render or behavior. For example, when an "applyFormPrototypeOff" feature flag is set to "true", the application form page is configured to disable or hide the prototype feature.

Our feature flags implementation can read feature flag values from environment variables, but can also read them from the frontend, and stores user settings on client side cookies. The intent is for these feature flags to be user configurable, so that

1. we can gate incomplete features to make it easier to coordinate development work, and
2. links can be sent to individuals with customized query parameters to customize the user's experience.

This means that any codebase/deployment level behavior that isn't meant for users to be able to configure themselves via the methods mentioned above should not use feature flags.

# Current Feature Flags

You can find and update the feature flags currently in use by the application in the [feature flags typescript file](/frontend/src/constants/featureFlags.ts).

# Usage

## Conventions and limitations

Feature flags will follow these conventions!

- feature flags should be named and conceived such that their default value is `false` or `off`. This allows us to easily implement custom behavior across the board when flags are turned on. For example, a feature flag to toggle the form prototype should be something like `applyFormPrototypeOff` or `disableApplyFormPrototype` and with a default value of `false`.
- feature flag names will use simple camel case naming, for example `applyFormPrototypeOff`
- names of environment variables for controlling feature flag values should match the name of the flags within the code, except
  - using snake case
  - all caps
  - with `FEATURE_` at the front
    - ex: flag `doSomethingSpecial` in code would be controlled by env var called `FEATURE_DO_SOMETHING_SPECIAL`

Feature flags have the following limitations!

- feature flags cannot control behavior of non page level components
- feature flags cannot pass props to components
- feature flags cannot affect build time behavior

Generally this means that feature flags can only currently be used to gate particular pages by redirecting them to other places, though slightly more creative usages are possible.

## Setting Flags

There are three ways to manage feature flags!

### Via environment variables

Each feature flag can be set by a corresponding environment variable based on the following the convention discussed above.

### Via the user's web browser

Have the user visit `/dev/feature-flags` in their browser; they can configure feature flags directly via the GUI.

### Via query parameters set on urls

To do so, add a query param of `_ff` to the site's url and use JSON notation for its value. A feature flag's value can
be `true` or `false`.

For example:

- To **enable** a feature flag called `v2`, you would use:
  `{url}?_ff=v2:true`
- To **disable** a feature flag called `v2`, you would use:
  `{url}?_ff=v2:false`

To set multiple feature flags on a single url, separate their key/value pairs with a `;`. For example:
`{url}?_ff=v2:true;another_flag:true`. If the same flag is included multiple times, the last one takes precedence.

Note, setting feature flags via the url will persist these values in the user's cookies. This way, users can send links to pages with feature flagged behavior. If a feature is released behind a feature flag a link could be sent to interested parties for feedback using the feature flagged url that would load the feature before it goes public. For example, to allow a particular stakeholder to try out a `v2` feature, but not necessarily enable it
for everyone else, you could simply send them the url `{url}?_ff=v2:true`.

## Resetting feature flags

To reset all feature flags to the default values in your browser cookie, add a query of `?_ff=reset` to the url.

## Precedence

Each feature flag will be set with a default value within the code. This default can be overridden in the following order:

- environment variables
- cookies
- query params

This means that if an flag is set to "false" by default, an environment variable set to "true" would override this, but a cookie value set to "false" would override the environment variable, and a query param set to "true" would take precedence over everything else.

# Development usage

Feature flags are implemented via two interfaces:

- The `useFeatureFlags` hook
- The `FeatureFlagsManager` class

## Frontend

When writing frontend code, we recommend using the `useFeatureFlag` hook since it is simpler to reference and also updates React state when updating feature flag values. You get the same interface as if you used the class directly.

```tsx
function MyComponent() {
  const {
    featureFlagsManager,  // An instance of FeatureFlagsManager
    mounted,  // Useful for hydration
    setFeatureFlag,  // Proxy for featureFlagsManager.setFeatureFlag that handles updating state
  } = useFeatureFlags()

  if (featureFlagsManager.isFeatureEnabled("someFeatureFlag")) {
    // Do something
  }

  if (!mounted) {
    // To allow hydration
    return null
  }

  return (
    ...
  )
}
```

## Backend

When writing backend code, you should use the manager class directly.

```typescript
export default async function handler(request, response) {
  const featureFlagsManager = new FeatureFlagsManager(request.cookies)
  if (featureFlagsManager.isFeatureEnabled("someFeatureFlag")) {
    // Do something
  }
  ...
}
```

## Adding feature flags

To add a new feature flag, you must:

1. Add it and a default value to the object exported from [the FeatureFlags constants file](https://github.com/HHS/simpler-grants-gov/blob/main/frontend/src/constants/featureFlags.ts)
2. If you want to control the feature flag with an environment variable add it to the list of environment variables [in the terraform](https://github.com/HHS/simpler-grants-gov/blob/main/infra/frontend/app-config/env-config/environment-variables.tf), and add variables for each environment in SSM
3. That's it! Everything else is handled for you!

## Testing

There are a few utility methods for helping with tests that involve feature flags.

```typescript
import {
  mockDefaultFeatureFlags,
  mockFeatureFlagsCookie,
} from "utils/tests/featureFlagsTestUtils";
```

`mockDefaultFeatureFlags` allows you to mock the value of `FeatureFlagsManager._defaultFeatureFlags`.
`mockFeatureFlagsCookie` allows you to mock the stored cookie value for feature flags.

You can also mock the `FeatureFlagsManager` directly to control whether a feature is enabled. For example:

```typescript
jest
  .spyOn(FeatureFlagsManager.prototype, "isFeatureEnabled")
  .mockReturnValue(true);
```

If you run into an error like "ReferenceError: Response is not defined", you should add the following to the top of the
test file that is affected

```typescript
/**
 * @jest-environment ./tests/utils/jsdomNodeEnvironment.ts
 */
```

This is because currently Jest is configured to run in the `jsdom` environment (enabling features like `window`), but
the feature flags integration also depends on some `node` environment features (middleware). The custom
`jsdomNodeEnvironment` jest environment polyfills node fetch globals to `jsdom` so that your tests can both have access
to `window` and use feature flag and feature flag mocking functionality.

## How it works

1. The next.js middleware hooks into `FeatureFlagsManager.middleware` which will take query params from the url and save the parsed values into the feature flags cookie (before a backend view function runs).
1. The backend view function can determine if a feature flag is enabled by using `FeatureFlagsManager`. See above for usage details.
1. The frontend components can determine if a feature flag is enabled by using `useFeatureFlags` (or `FeatureFlagsManager` directly). See above for usage details. Note, the feature flags query params in the url are meant for the middleware only and are ignored with normal frontend usage.

# Graceful user cookie handling

The `FeatureFlagsManager` and middleware integration intelligently and gracefully handles cookie value errors such that if the cookie were ever to get corrupted, the site will not break.

- Invalid query param formats, invalid feature flag names, and invalid feature flag values are ignored
- If the cookie value is corrupted, a new cookie value set to the default feature flag values will be set
- The cookie is read every time we check if a feature flag is enabled, so it also handles changes to the cookie made by another page or request

# Updating default feature flags in deployed apps

When the default value of a flag should be updated for all users of a deployed application, for examople when turning on a new feature:

First, gather the name for the SSM parameter from terraform. You may need to trace through from frontend variable name -> env var name (found in environments.ts) -> SSM param name (found in frontend/app-config/env-config/environment_variables.tf). The name will look something like `/<application>/<environment>/<name-of-flag>`

For PROD and Training:

1. log in to AWS. Note that this can only be done by a user with write access to AWS
2. go to Systems Manager
3. scroll down to the Parameter Store link on the left nav
4. find the right entry for the feature flag, found in step one
5. click edit
6. set value and save
7. you will need to manually redeploy or restart the frontend ECS service to pick up the new value of the feature flag

For DEV and Staging:

1. go to https://github.com/HHS/simpler-grants-gov/actions/workflows/update-frontend-feature-flag.yml
2. click run workflow
3. choose the feature flag in the drop down that you found in step one
4. set value and environment
5. click run workflow
6. this will automatically restart the service after setting the feature flag

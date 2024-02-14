# Feature flags

This feature flags implementation stores feature flags settings on user cookies. The intent is for these feature flags
to be user configurable, so that 1. we can gate incomplete features to make it easier to coordinate development work,
and 2. links can be sent to individuals with customized query parameters to customize the user's experience.

For codebase/deployment level feature flagging that isn't meant for users to be able to configure, those continue to be
implemented using `process.env`.

## Feature flags in use

As of February 2024, the following feature flags are set in the project:
1. hideSearch - 
  * Defaults to true
  * This is for hiding the search page as it is being developed and user tested
  * This should be removed when the search page goes live, before May 2024

## Non-developer usage

There are two ways to manage feature flags.

### Via the user's web browser

Have the user visit `/dev/feature-flags` in their browser; they can configure feature flags directly via the GUI. **This page is only accessible in non-production environments**.

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

Note, setting feature flags via the url will persist these values in the user's cookies. This is so that you can send
links to stakeholders with feature flags personalized to the experience you'd like them to experience.

For example, if you want to allow a particular stakeholder to trial out the `v2` feature, but not necessarily enable it
for everyone else, simply send them the url `{url}?_ff=v2:true`.

### Resetting feature flags

To reset all feature flags to the default values in your browser cookie, add a query of `?_ff=reset` to the url. 

## Development usage

Feature flags are implemented via two interfaces:

- The `useFeatureFlags` hook
- The `FeatureFlagsManager` class

### Frontend

When writing frontend code, we recommend using the `useFeatureFlag` hook since it is simpler to reference and also
updates React state when updating feature flag values. You get the same interface as if you used the class directly.

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

### Backend

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

### Adding feature flags

To add a new feature flag, you must:

1. Add it and a default value to `FeatureFlagsManager._defaultFeatureFlags`
1. Add it to the list of feature flags in this file.
1. That's it! Everything else is handled for you!

### Testing

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

### How it works

1. The next.js middleware hooks into `FeatureFlagsManager.middleware` which will take query params from the url and save
   the parsed values into the feature flags cookie (before a backend view function runs).
1. The backend view function can determine if a feature flag is enabled by using `FeatureFlagsManager`. See above for
   usage details.
1. The frontend components can determine if a feature flag is enabled by using `useFeatureFlags` (or
   `FeatureFlagsManager` directly). See above for usage details. Note, the feature flags query params in the url are
   meant for the middleware only and are ignored with normal frontend usage.

## Graceful user cookie handling

The `FeatureFlagsManager` and middleware integration intelligently and gracefully handles cookie value errors such that
if the cookie were ever to get corrupted, the site will not break.

- Invalid query param formats, invalid feature flag names, and invalid feature flag values are ignored
- If the cookie value is corrupted, a new cookie value set to the default feature flag values will be set
- The cookie is read every time we check if a feature flag is enabled, so it is also handles changes to the cookie made
  by another page or request

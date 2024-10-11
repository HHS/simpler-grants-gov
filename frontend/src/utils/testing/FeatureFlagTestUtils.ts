/**
 * Feature flags test utils
 *
 * This is split into its own file these functions have both jest `node` (`Request` and `Response`)
 * and jest `jsdom` (`Request`, `Response) environment dependencies.
 *
 * By keeping this file separate, tests that don't need these methods can simply use either the
 * default `jsdom` test environment or specify the `node` environments. Otherwise, they would need
 * to manually specify the custom `./src/utils/test/jsdomNodeEnvironment.ts` environment.
 */

import {
  FeatureFlags,
  FeatureFlagsManager,
} from "src/services/FeatureFlagManager";

/**
 * Mock feature flags cookie in `window.document` so that we don't need to mock
 * `js-cookie` directly.
 */
export function mockFeatureFlagsCookie(cookieValue: FeatureFlags) {
  Object.defineProperty(window.document, "cookie", {
    writable: true,
    value: `${FeatureFlagsManager.FEATURE_FLAGS_KEY}=${JSON.stringify(
      cookieValue,
    )}`,
  });
}

/**
 * Mock default feature flags defined in `FeatureFlagsManager`.
 *
 * This lets you write tests independent of what feature flags exist.
 */
export function mockDefaultFeatureFlags(defaultFeatureFlags: FeatureFlags) {
  jest
    .spyOn(FeatureFlagsManager.prototype, "defaultFeatureFlags", "get")
    .mockReturnValue(defaultFeatureFlags);
}

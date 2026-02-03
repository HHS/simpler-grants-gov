import { createFeatureFlagHarness } from "src/test/harness/featureFlagHarness";
import { loadIsolatedPageModule } from "src/test/harness/loadIsolatedPageModule";
import { FeatureFlagMode } from "src/test/types/featureFlagTypes";

/**
 * Loads a module in isolation with the feature flag harness applied.
 */
export function loadPageWithFeatureFlagHarness<PageModule>(
  modulePath: string,
  initialMode: FeatureFlagMode,
): {
  pageModule: PageModule;
  featureFlagHarness: ReturnType<typeof createFeatureFlagHarness>;
} {
  const featureFlagHarness = createFeatureFlagHarness({ initialMode });

  const pageModule = loadIsolatedPageModule<PageModule>(modulePath, [
    featureFlagHarness,
  ]);

  return { pageModule, featureFlagHarness };
}

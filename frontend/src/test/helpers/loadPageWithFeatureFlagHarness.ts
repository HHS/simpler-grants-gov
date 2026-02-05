import type { JSX } from "react";

import { createFeatureFlagHarness } from "src/test/harness/featureFlagHarness";
import type { FeatureFlagHarness } from "src/test/harness/featureFlagHarness";
import { loadIsolatedPageModule } from "src/test/harness/loadIsolatedPageModule";
import type { FeatureFlagMode } from "src/test/types/featureFlagTypes";

export type DefaultPageModule<Params> = {
  default: (args: { params: Promise<Params> }) => Promise<JSX.Element>;
};

/**
 * Loads a page module in an isolated module graph with the feature flag harness applied.
 *
 * Most pages only export `default`. If a page exports additional members (e.g. `generateMetadata`),
 * callers can provide a narrower `PageModule` type.
 */
export function loadPageWithFeatureFlagHarness<
  Params,
  PageModule extends DefaultPageModule<Params> = DefaultPageModule<Params>,
>(
  modulePath: string,
  mode: FeatureFlagMode,
): { pageModule: PageModule; featureFlagHarness: FeatureFlagHarness } {
  const featureFlagHarness = createFeatureFlagHarness({ initialMode: mode });

  const pageModule = loadIsolatedPageModule<PageModule>(modulePath, [
    featureFlagHarness,
  ]);

  return { pageModule, featureFlagHarness };
}
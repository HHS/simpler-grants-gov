import {
  loadIsolatedPageModule,
  type Harness,
} from "src/test/harness/loadIsolatedPageModule";

import type { JSX } from "react";

export type DefaultPageModule<Params> = {
  default: (args: { params: Promise<Params> }) => Promise<JSX.Element>;
};

export type LoadPageWithHarnessesResult<PageModule> = {
  pageModule: PageModule;
};

/**
 * Loads a page module in an isolated module graph with the provided harnesses applied.
 *
 * Use this for Next.js App Router pages where module evaluation can execute logic at import time.
 *
 * Most pages only export `default`.
 * If a page exports additional members (e.g. `generateMetadata`),
 *
 * callers can provide a `PageModule` type that includes those exports.
 */
export function loadPageWithHarnesses<
  Params,
  PageModule extends DefaultPageModule<Params> = DefaultPageModule<Params>,
>(
  modulePath: string,
  harnesses: readonly Harness[] = [],
): LoadPageWithHarnessesResult<PageModule> {
  const pageModule = loadIsolatedPageModule<PageModule>(modulePath, harnesses);
  return { pageModule };
}

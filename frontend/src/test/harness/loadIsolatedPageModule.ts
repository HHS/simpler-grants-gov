import { loadIsolatedModule } from "./loadIsolatedModule";

/**
 * Minimal interface implemented by all harnesses.
 *
 * A harness registers its own Jest mocks.
 */
export type Harness = {
  registerMock(): void;
};

/**
 * Loads a page module with one or more harnesses applied.
 *
 * Harnesses are executed in the order provided.
 */
export function loadIsolatedPageModule<PageModule>(
  modulePath: string,
  harnesses: readonly Harness[],
): PageModule {
  return loadIsolatedModule<PageModule>(modulePath, () => {
    for (const harness of harnesses) {
      harness.registerMock();
    }
  });
}

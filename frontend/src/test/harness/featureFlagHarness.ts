import { FeatureFlagMode } from "src/test/types/featureFlagTypes";

import type { FunctionComponent, ReactNode } from "react";

import type { Harness } from "./loadIsolatedPageModule";

/**
 * Captured wiring data from withFeatureFlag usage.
 */
type CapturedFeatureFlagWiring = {
  featureFlagName: string | null;
  hasOnEnabledCallback: boolean;
};

type CreateFeatureFlagHarnessOptions = {
  initialMode: FeatureFlagMode;
};

export type FeatureFlagHarness = Harness & {
  setMode(nextMode: FeatureFlagMode): void;
  getCaptured(): CapturedFeatureFlagWiring;
};

/**
 * Test harness for withFeatureFlag.
 *
 * - Simulates flag enabled/disabled branches
 * - Captures how the wrapper is wired
 * - Does not read cookies, env vars, or Next internals
 */
export function createFeatureFlagHarness(
  options: CreateFeatureFlagHarnessOptions,
): FeatureFlagHarness {
  let mode: FeatureFlagMode = options.initialMode;

  const captured: CapturedFeatureFlagWiring = {
    featureFlagName: null,
    hasOnEnabledCallback: false,
  };

  function setMode(nextMode: FeatureFlagMode): void {
    mode = nextMode;
  }

  function getCaptured(): CapturedFeatureFlagWiring {
    return { ...captured };
  }

  function registerMock(): void {
    jest.doMock("src/services/featureFlags/withFeatureFlag", () => {
      const withFeatureFlag = <P, R extends ReactNode>(
        WrappedComponent: FunctionComponent<P>,
        featureFlagName: string,
        onEnabled: (props: P) => R,
      ) => {
        captured.featureFlagName = featureFlagName;
        captured.hasOnEnabledCallback = typeof onEnabled === "function";

        const FeatureFlaggedComponent: FunctionComponent<P> = (props) => {
          if (mode === "flagEnabled") {
            return onEnabled(props) as unknown as ReactNode;
          }

          return WrappedComponent(props);
        };

        return FeatureFlaggedComponent;
      };

      return {
        __esModule: true,
        default: withFeatureFlag,
      };
    });
  }

  return {
    registerMock,
    setMode,
    getCaptured,
  };
}

/**
 * Asserts that withFeatureFlag was wired with the expected flag name.
 *
 * This validates page wiring without testing wrapper internals.
 */
export function expectFeatureFlagWiring(
  harness: FeatureFlagHarness,
  expectedFlagName: string,
): void {
  const captured = harness.getCaptured();

  expect(captured.featureFlagName).toBe(expectedFlagName);
}

/**
 * Asserts that a page is wrapped by withFeatureFlag,
 * without asserting the specific flag name.
 *
 * Use this when the test cares about the presence of
 * feature flag gating, but not the exact flag used.
 */
export function expectAnyFeatureFlagWiring(harness: FeatureFlagHarness): void {
  const captured = harness.getCaptured();
  expect(captured.featureFlagName).not.toBeNull();
}

/**
 * Feature flag wrapper behavior to simulate in tests.
 *
 * - flagDisabled: wrapper renders the wrapped component
 * - flagEnabled: wrapper executes the onEnabled callback
 */
export type FeatureFlagMode = "flagEnabled" | "flagDisabled";

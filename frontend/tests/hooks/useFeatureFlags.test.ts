import { act, renderHook } from "@testing-library/react";

import { useFeatureFlags } from "src/hooks/useFeatureFlags";
import { mockDefaultFeatureFlags } from "tests/utils/FeatureFlagTestUtils";

describe("useFeatureFlags", () => {
  const MOCK_FEATURE_FLAG_NAME = "mockFeatureName";
  const MOCK_FEATURE_FLAG_INITIAL_VALUE = true;

  beforeEach(() => {
    mockDefaultFeatureFlags({
      [MOCK_FEATURE_FLAG_NAME]: MOCK_FEATURE_FLAG_INITIAL_VALUE,
    });
  });

  test("should allow you to update feature flags using FeatureFlagManager", () => {
    const { result } = renderHook(() => useFeatureFlags());

    const { featureFlagsManager, setFeatureFlag } = result.current;

    expect(featureFlagsManager.isFeatureEnabled(MOCK_FEATURE_FLAG_NAME)).toBe(
      MOCK_FEATURE_FLAG_INITIAL_VALUE,
    );
    act(() => {
      setFeatureFlag(MOCK_FEATURE_FLAG_NAME, !MOCK_FEATURE_FLAG_INITIAL_VALUE);
    });
    expect(featureFlagsManager.isFeatureEnabled(MOCK_FEATURE_FLAG_NAME)).toBe(
      !MOCK_FEATURE_FLAG_INITIAL_VALUE,
    );
  });
});

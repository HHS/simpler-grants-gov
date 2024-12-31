import { act, renderHook } from "@testing-library/react";
import { useFeatureFlags } from "src/hooks/useFeatureFlags";
import { FEATURE_FLAGS_KEY } from "src/services/featureFlags/featureFlagHelpers";

const mockSetCookie = jest.fn();
const mockGetCookie = jest.fn();

jest.mock("js-cookie", () => ({
  get: () => mockGetCookie(),
  set: (...args) => mockSetCookie(...args),
}));

describe("useFeatureFlags", () => {
  const MOCK_FEATURE_FLAG_NAME = "mockFeatureName";
  const MOCK_FEATURE_FLAG_INITIAL_VALUE = true;

  test("should allow you to update feature flags on client cookie", () => {
    const { result } = renderHook(() => useFeatureFlags());

    const { setFeatureFlag } = result.current;

    act(() => {
      setFeatureFlag(MOCK_FEATURE_FLAG_NAME, !MOCK_FEATURE_FLAG_INITIAL_VALUE);
    });

    expect(mockSetCookie).toHaveBeenCalledWith(
      FEATURE_FLAGS_KEY,
      JSON.stringify({
        [MOCK_FEATURE_FLAG_NAME]: !MOCK_FEATURE_FLAG_INITIAL_VALUE,
      }),
      {
        expires: expect.any(Date) as Date,
      },
    );
  });
});

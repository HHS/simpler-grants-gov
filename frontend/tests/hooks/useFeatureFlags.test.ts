import { act, renderHook } from "@testing-library/react";
import { useFeatureFlags } from "src/hooks/useFeatureFlags";
import { FEATURE_FLAGS_KEY } from "src/services/featureFlags/featureFlagHelpers";

const MOCK_DEFAULT_FEATURE_FLAGS = {
  someFakeFeature1: true,
  someFakeFeature2: true,
  someFakeFeature3: true,
};

const mockDefaultFeatureFlagsString = JSON.stringify(
  MOCK_DEFAULT_FEATURE_FLAGS,
);
const MOCK_FEATURE_FLAG_NAME = "mockFeatureName";
const MOCK_FEATURE_FLAG_INITIAL_VALUE = true;

const mockSetCookie = jest.fn();
const mockGetCookie = jest.fn();

jest.mock("js-cookie", () => ({
  get: () => mockGetCookie() as unknown,
  set: (...args: unknown[]) => mockSetCookie(...args) as unknown,
}));

describe("useFeatureFlags", () => {
  afterEach(() => {
    jest.resetAllMocks();
  });
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

  test("returns list feature flags from cookie", () => {
    mockGetCookie.mockReturnValue(mockDefaultFeatureFlagsString);
    const { result } = renderHook(() => useFeatureFlags());

    const { featureFlags } = result.current;

    expect(featureFlags).toEqual(MOCK_DEFAULT_FEATURE_FLAGS);
  });

  describe("checkFeatureFlag", () => {
    test("allows checking value of individual flag", () => {
      mockGetCookie.mockReturnValue(mockDefaultFeatureFlagsString);
      const { result } = renderHook(() => useFeatureFlags());

      const { checkFeatureFlag } = result.current;

      const value = checkFeatureFlag("someFakeFeature1");
      expect(value).toEqual(true);
    });

    test("returns false if specified flag is not present", () => {
      mockGetCookie.mockReturnValue(mockDefaultFeatureFlagsString);
      const { result } = renderHook(() => useFeatureFlags());

      const { checkFeatureFlag } = result.current;

      const value = checkFeatureFlag("someFakeFeature4");
      expect(value).toEqual(false);
    });
  });
});

import { act, renderHook } from "@testing-library/react";
import { useFeatureFlags } from "src/hooks/useFeatureFlags";
import { UserContextHook } from "src/services/auth/useUser";

const MOCK_FEATURE_FLAG_NAME = "mockFeatureName";
const MOCK_FEATURE_FLAG_INITIAL_VALUE = true;

const mockPush = jest.fn();
const mockUseUser = jest.fn();

const mockSetCookie = jest.fn();
const mockGetCookie = jest.fn();

jest.mock("js-cookie", () => ({
  get: () => mockGetCookie() as unknown,
  set: (...args: unknown[]) => mockSetCookie(...args) as unknown,
}));

jest.mock("next/navigation", () => ({
  usePathname: jest.fn(() => "/test") as jest.Mock<string>,
  useRouter() {
    return {
      prefetch: () => null,
      push: (arg: string) => mockPush(arg) as undefined,
    };
  },
}));

jest.mock("src/services/auth/useUser", () => ({
  useUser: () => mockUseUser() as UserContextHook,
}));
describe("useFeatureFlags", () => {
  afterEach(() => {
    jest.resetAllMocks();
  });
  test("should allow you to update feature flag query param", () => {
    mockUseUser.mockReturnValue({ featureFlags: { someFlag: true } });
    const { result } = renderHook(() => useFeatureFlags());

    const { setFeatureFlag } = result.current;

    act(() => {
      setFeatureFlag(MOCK_FEATURE_FLAG_NAME, !MOCK_FEATURE_FLAG_INITIAL_VALUE);
    });

    expect(mockPush).toHaveBeenCalledWith(
      `/test?_ff=${MOCK_FEATURE_FLAG_NAME}%3A${(!MOCK_FEATURE_FLAG_INITIAL_VALUE).toString()}`,
    );
  });

  test("returns list feature flags from user provider", () => {
    mockUseUser.mockReturnValue({ featureFlags: { someFlag: true } });
    const { result } = renderHook(() => useFeatureFlags());

    const { featureFlags } = result.current;

    expect(featureFlags).toEqual({ someFlag: true });
  });

  describe("checkFeatureFlag", () => {
    test("allows checking value of individual flag", () => {
      mockUseUser.mockReturnValue({ featureFlags: { someFlag: true } });
      const { result } = renderHook(() => useFeatureFlags());

      const { checkFeatureFlag } = result.current;

      const value = checkFeatureFlag("someFlag");
      expect(value).toEqual(true);
    });

    test("returns false if specified flag is not present", () => {
      mockUseUser.mockReturnValue({ featureFlags: { someFlag: true } });
      const { result } = renderHook(() => useFeatureFlags());

      const { checkFeatureFlag } = result.current;

      const value = checkFeatureFlag("someFakeFeature4");
      expect(value).toEqual(false);
    });
  });
});

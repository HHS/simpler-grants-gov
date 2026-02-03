/**
 * @jest-environment ./src/test/jest-environments/jsdomNodeEnvironment.ts
 */

import { FEATURE_FLAGS_KEY } from "src/services/featureFlags/featureFlagHelpers";
import { FeatureFlagsManager } from "src/services/featureFlags/FeatureFlagManager";
import {
  mockDefaultFeatureFlags,
  mockFeatureFlagsCookie,
} from "src/utils/testing/FeatureFlagTestUtils";

import { RequestCookies } from "next/dist/compiled/@edge-runtime/cookies";
import { NextRequest, NextResponse } from "next/server";

const mockParseFeatureFlagsFromString = jest.fn();
const mockIsValidFeatureFlag = jest.fn();
const mockGetFeatureFlagsFromCookie = jest.fn();

jest.mock("src/constants/environments", () => ({
  featureFlags: {
    fakeOne: "true",
    fakeTwo: "false",
    nonBool: "sure",
  },
  environment: {
    ENVIRONMENT: "not prod",
  },
}));

jest.mock("src/services/featureFlags/featureFlagHelpers", () => ({
  ...jest.requireActual<
    typeof import("src/services/featureFlags/featureFlagHelpers")
  >("src/services/featureFlags/featureFlagHelpers"),
  parseFeatureFlagsFromString: (params: string): unknown =>
    mockParseFeatureFlagsFromString(params),
  isValidFeatureFlag: (name: string): unknown => mockIsValidFeatureFlag(name),
  getFeatureFlagsFromCookie: (): unknown => mockGetFeatureFlagsFromCookie(),
}));

const DEFAULT_FEATURE_FLAGS = {
  feature1: true,
  feature2: false,
  feature3: true,
};

const COOKIE_VALUE: { [key: string]: boolean } = { feature1: true };

function MockServerCookiesModule(cookieValue = COOKIE_VALUE) {
  return {
    get: (name: string) => {
      if (name === FEATURE_FLAGS_KEY) {
        return {
          value: JSON.stringify(cookieValue),
        };
      }
    },
    set: jest.fn(),
  } as object as NextRequest["cookies"];
}

describe("FeatureFlagsManager", () => {
  let featureFlagsManager: FeatureFlagsManager;

  beforeEach(() => {
    mockFeatureFlagsCookie(COOKIE_VALUE);

    // Mock default feature flags to allow for tests to be independent of actual default values
    mockDefaultFeatureFlags(DEFAULT_FEATURE_FLAGS);

    featureFlagsManager = new FeatureFlagsManager({});
    mockIsValidFeatureFlag.mockReturnValue(true);
  });
  afterEach(() => {
    jest.resetAllMocks();
  });

  describe("middleware", () => {
    test("processes feature flags from query params", () => {
      const expectedFeatureFlags = {
        feature1: false,
      };
      mockParseFeatureFlagsFromString.mockImplementation(
        () => expectedFeatureFlags,
      );
      const mockSet = jest.fn();
      jest
        .spyOn(NextResponse.prototype, "cookies", "get")
        .mockReturnValue({ set: mockSet } as object as NextResponse["cookies"]);

      const request = new NextRequest(new Request("fakeUrl://not.real"), {});

      featureFlagsManager.middleware(request, NextResponse.next());
      expect(mockSet).toHaveBeenCalledWith({
        expires: expect.any(Date) as jest.Expect,
        name: FEATURE_FLAGS_KEY,
        value: JSON.stringify({
          ...expectedFeatureFlags,
        }),
      });
    });

    test("sets cookie with correct from query param based flags", () => {
      mockParseFeatureFlagsFromString.mockImplementation(() => ({
        feature2: true,
      }));
      const request = new NextRequest(new Request("fakeUrl://not.real"), {});
      const mockSet = jest.fn();
      jest
        .spyOn(NextResponse.prototype, "cookies", "get")
        .mockReturnValue({ set: mockSet } as object as NextResponse["cookies"]);

      const featureFlagsManager = new FeatureFlagsManager({
        feature3: "false",
      });
      featureFlagsManager.middleware(request, NextResponse.next());
      expect(mockSet).toHaveBeenCalledWith({
        expires: expect.any(Date) as jest.Expect,
        name: FEATURE_FLAGS_KEY,
        value: JSON.stringify({
          feature2: true, // from query param
        }),
      });
    });

    test("clears cookie correctly on `reset` value", () => {
      const request = new NextRequest(
        new Request("fakeUrl://not.real?_ff=reset"),
        {},
      );
      const mockSet = jest.fn();
      const mockDelete = jest.fn();
      jest.spyOn(NextResponse.prototype, "cookies", "get").mockReturnValue({
        set: mockSet,
        delete: mockDelete,
      } as object as NextResponse["cookies"]);

      const featureFlagsManager = new FeatureFlagsManager({
        feature3: "false",
      });
      featureFlagsManager.middleware(request, NextResponse.next());

      expect(mockDelete).toHaveBeenCalledWith({ name: FEATURE_FLAGS_KEY });
      expect(mockSet).not.toHaveBeenCalled();
    });

    test("clears cookie correctly if no user unique values need to be tracked", () => {
      const expectedFeatureFlags = {
        feature1: false,
      };
      mockParseFeatureFlagsFromString.mockImplementation(
        () => expectedFeatureFlags,
      );
      const request = new NextRequest(new Request("fakeUrl://not.real"), {});

      const mockSet = jest.fn();
      const mockDelete = jest.fn();
      jest.spyOn(NextResponse.prototype, "cookies", "get").mockReturnValue({
        set: mockSet,
        delete: mockDelete,
      } as object as NextResponse["cookies"]);

      const featureFlagsManager = new FeatureFlagsManager({
        feature1: "true",
      });
      featureFlagsManager.middleware(request, NextResponse.next());

      expect(mockSet).toHaveBeenCalledWith({
        expires: expect.any(Date) as jest.Expect,
        name: FEATURE_FLAGS_KEY,
        value: JSON.stringify({
          ...expectedFeatureFlags,
        }),
      });
      expect(mockDelete).not.toHaveBeenCalled();

      mockDelete.mockClear();
      mockSet.mockClear();

      const featureFlagsManager2 = new FeatureFlagsManager({
        feature1: "false",
      });
      featureFlagsManager2.middleware(request, NextResponse.next());

      expect(mockDelete).toHaveBeenCalledWith({ name: FEATURE_FLAGS_KEY });
      expect(mockSet).not.toHaveBeenCalled();
    });
  });

  describe("isFeatureEnabled", () => {
    test("correctly interprets values from basic internal feature flags with no passed cookies", () => {
      mockIsValidFeatureFlag.mockReturnValue(true);
      Object.entries(featureFlagsManager.featureFlags).forEach(
        ([name, enabled]) => {
          expect(
            featureFlagsManager.isFeatureEnabled(
              name,
              new RequestCookies(new Headers()),
            ),
          ).toEqual(enabled);
        },
      );
    });

    test("reads values from passed cookies", () => {
      mockGetFeatureFlagsFromCookie.mockReturnValue({});
      const currentFeatureFlags = featureFlagsManager.featureFlags;

      const featureFlagToUpdateName = Object.keys(
        featureFlagsManager.featureFlags,
      )[0];
      const currentValue = currentFeatureFlags[featureFlagToUpdateName];
      expect(
        featureFlagsManager.isFeatureEnabled(
          featureFlagToUpdateName,
          new RequestCookies(new Headers()),
        ),
      ).toEqual(currentValue);

      mockGetFeatureFlagsFromCookie.mockReturnValue({
        [featureFlagToUpdateName]: !currentValue,
      });
      expect(
        featureFlagsManager.isFeatureEnabled(
          featureFlagToUpdateName,
          new RequestCookies(new Headers()),
        ),
      ).toEqual(!currentValue);
    });

    test("reads values from query params", () => {
      mockGetFeatureFlagsFromCookie.mockReturnValue({});
      const currentFeatureFlags = featureFlagsManager.featureFlags;

      const featureFlagToUpdateName = Object.keys(
        featureFlagsManager.featureFlags,
      )[0];
      const currentValue = currentFeatureFlags[featureFlagToUpdateName];

      mockParseFeatureFlagsFromString.mockReturnValue({
        [featureFlagToUpdateName]: !currentValue,
      });

      expect(
        featureFlagsManager.isFeatureEnabled(
          featureFlagToUpdateName,
          new RequestCookies(new Headers()),
          { [FEATURE_FLAGS_KEY]: "some: junk" },
        ),
      ).toEqual(!currentValue);
    });

    test("throws an error if accessing an invalid feature flag", () => {
      mockIsValidFeatureFlag.mockReturnValue(false);
      expect(() =>
        featureFlagsManager.isFeatureEnabled(
          "any",
          new RequestCookies(new Headers()),
        ),
      ).toThrow();
    });
    describe("feature flag precedence", () => {
      it("overrides defaults with env vars", () => {
        mockDefaultFeatureFlags({
          fakeOne: false,
          fakeTwo: true,
        });
        // Set a different state in cookies to test precedence
        const modifiedCookieValue = {};
        mockFeatureFlagsCookie(modifiedCookieValue);
        const serverFeatureFlagsManager = new FeatureFlagsManager({
          fakeOne: "true",
          fakeTwo: "false",
        });

        expect(
          serverFeatureFlagsManager.isFeatureEnabled(
            "fakeOne",
            MockServerCookiesModule(),
          ),
        ).toBe(true);
        expect(
          serverFeatureFlagsManager.isFeatureEnabled(
            "fakeTwo",
            MockServerCookiesModule(),
          ),
        ).toBe(false);
      });

      it("overrides env vars with cookies", () => {
        mockDefaultFeatureFlags({
          fakeOne: false,
          fakeTwo: true,
        });
        // Set a different state in cookies to test precedence
        const modifiedCookieValue = {
          fakeOne: false,
          fakeTwo: true,
        };
        mockFeatureFlagsCookie(modifiedCookieValue);
        const serverFeatureFlagsManager = new FeatureFlagsManager({});

        expect(
          serverFeatureFlagsManager.isFeatureEnabled(
            "fakeOne",
            MockServerCookiesModule(),
          ),
        ).toBe(false);
        expect(
          serverFeatureFlagsManager.isFeatureEnabled(
            "fakeTwo",
            MockServerCookiesModule(),
          ),
        ).toBe(true);
      });

      test("`searchParams` override takes precedence over default and cookie-based feature flags", () => {
        // Set a different state in cookies to test precedence
        const modifiedCookieValue = { feature1: true };
        mockFeatureFlagsCookie(modifiedCookieValue);
        const serverFeatureFlagsManager = new FeatureFlagsManager({});

        // Now provide searchParams with a conflicting setup
        const searchParams = {
          _ff: "feature1:false",
        };

        mockParseFeatureFlagsFromString.mockReturnValue({
          feature1: false,
        });

        expect(
          serverFeatureFlagsManager.isFeatureEnabled(
            "feature1",
            MockServerCookiesModule(),
            searchParams,
          ),
        ).toBe(false);
      });
    });
  });

  describe("featureFlags (getter)", () => {
    it("returns hardcoded default values if env vars not defined, and boolean versions of env var values if defined", () => {
      mockDefaultFeatureFlags({
        somethingToDefault: true,
        anotherThingToDefault: false,
      });
      featureFlagsManager = new FeatureFlagsManager({
        envVarFlagOne: "true",
        anotherEnvVarFlag: "false",
      });
      expect(featureFlagsManager.featureFlags).toEqual({
        somethingToDefault: true,
        anotherThingToDefault: false,
        envVarFlagOne: true,
        anotherEnvVarFlag: false,
      });
    });
    it("overrides default values with env var values where env var value is defined", () => {
      mockDefaultFeatureFlags({
        somethingToOverride: true,
        somethingToDefault: true,
      });
      featureFlagsManager = new FeatureFlagsManager({
        somethingToOverride: "false",
      });
      expect(featureFlagsManager.featureFlags).toEqual({
        somethingToOverride: false,
        somethingToDefault: true,
      });
    });
  });
});

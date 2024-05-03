/**
 * @jest-environment ./tests/utils/jsdomNodeEnvironment.ts
 */

import { NextRequest, NextResponse } from "next/server";
import {
  mockDefaultFeatureFlags,
  mockFeatureFlagsCookie,
} from "../utils/FeatureFlagTestUtils";

import Cookies from "js-cookie";
import { FeatureFlagsManager } from "../../src/services/FeatureFlagManager";
import { mockProcessEnv } from "../utils/commonTestUtils";

describe("FeatureFlagsManager", () => {
  const COOKIE_VALUE = { feature1: true };
  const DEFAULT_FEATURE_FLAGS = {
    feature1: true,
    feature2: false,
    feature3: true,
  };

  const MockServerCookiesModule = {
    get: (name: string) => {
      if (name === FeatureFlagsManager.FEATURE_FLAGS_KEY) {
        return {
          value: JSON.stringify(COOKIE_VALUE),
        };
      }
    },
    set: jest.fn(),
  } as object as NextRequest["cookies"];

  let featureFlagsManager: FeatureFlagsManager;

  beforeEach(() => {
    mockFeatureFlagsCookie(COOKIE_VALUE);

    // Mock default feature flags to allow for tests to be independent of actual default values
    mockDefaultFeatureFlags(DEFAULT_FEATURE_FLAGS);

    featureFlagsManager = new FeatureFlagsManager(Cookies);
  });

  test("`.featureFlagsCookie` getter loads feature flags with client-side js-cookies", () => {
    expect(featureFlagsManager.featureFlagsCookie).toEqual(COOKIE_VALUE);
  });

  test('`.featureFlagsCookie` getter loads feature flags with server-side NextRequest["cookies"]', () => {
    const serverFeatureFlagsManager = new FeatureFlagsManager(
      MockServerCookiesModule,
    );
    expect(serverFeatureFlagsManager.featureFlagsCookie).toEqual(COOKIE_VALUE);
  });

  test("`.featureFlagsCookie` getter loads feature flags with server-side getServerSideProps cookies", () => {
    const cookieRecord = {
      // Was unable to override flag keys. Use feature flag class invocation default for now.
      _ff: JSON.stringify(COOKIE_VALUE),
    };
    const serverFeatureFlagsManager = new FeatureFlagsManager(cookieRecord);
    expect(serverFeatureFlagsManager.featureFlagsCookie).toEqual(COOKIE_VALUE);
  });

  test("`.featureFlagsCookie` does not error if the cookie value is empty", () => {
    Object.defineProperty(window.document, "cookie", {
      writable: true,
      value: "",
    });
    expect(Cookies.get(FeatureFlagsManager.FEATURE_FLAGS_KEY)).toEqual(
      undefined,
    );
    expect(featureFlagsManager.featureFlagsCookie).toEqual({});
  });

  test("`.featureFlagsCookie` does not error if the cookie value is invalid", () => {
    const invalidCookieValue = "----------------";
    Object.defineProperty(window.document, "cookie", {
      writable: true,
      value: `${FeatureFlagsManager.FEATURE_FLAGS_KEY}=${invalidCookieValue}`,
    });
    expect(() => JSON.parse(invalidCookieValue) as string).toThrow();
    expect(Cookies.get(FeatureFlagsManager.FEATURE_FLAGS_KEY)).toEqual(
      invalidCookieValue,
    );
    expect(featureFlagsManager.featureFlagsCookie).toEqual({});
  });

  test("`.featureFlagsCookie` does not include invalid feature flags even if cookie value includes it", () => {
    const invalidFeatureFlag = "someInvalidFeatureFlagName";
    expect(featureFlagsManager.isValidFeatureFlag(invalidFeatureFlag)).toBe(
      false,
    );
    Object.defineProperty(window.document, "cookie", {
      writable: true,
      value: JSON.stringify({ [invalidFeatureFlag]: true }),
    });
    expect(featureFlagsManager.featureFlagsCookie).toEqual({});
  });

  test("`.featureFlagsCookie` does not include feature flags if the value is not a boolean", () => {
    const validFeatureFlag = "feature1";
    expect(featureFlagsManager.isValidFeatureFlag(validFeatureFlag)).toBe(true);
    Object.defineProperty(window.document, "cookie", {
      writable: true,
      value: JSON.stringify({
        [validFeatureFlag]: "someInvalidFeatureFlagValue",
      }),
    });
    expect(featureFlagsManager.featureFlagsCookie).toEqual({});
  });

  test.each([
    "string",
    '"string"',
    {},
    [],
    1,
    1.1,
    "true",
    null,
    undefined,
    "",
  ])(
    "`.featureFlagsCookie` does not include feature flags if the value is not a boolean",
    (featureFlagValue) => {
      const featureName = "feature1";
      expect(featureFlagsManager.isValidFeatureFlag(featureName)).toBe(true);
      mockFeatureFlagsCookie({ [featureName]: featureFlagValue as boolean });
      expect(featureFlagsManager.featureFlagsCookie).toEqual({});
    },
  );

  test("`.featureFlags` getter loads cookie value and combines with default feature flags", () => {
    const expectedFeatureFlags = {
      ...featureFlagsManager.defaultFeatureFlags,
      ...COOKIE_VALUE,
    };
    expect(featureFlagsManager.featureFlags).toEqual(expectedFeatureFlags);
  });

  test("`.featureFlags` uses default feature flags if no cookie is present", () => {
    Cookies.set(FeatureFlagsManager.FEATURE_FLAGS_KEY, JSON.stringify({}));
    expect(featureFlagsManager.featureFlagsCookie).toEqual({});
    expect(featureFlagsManager.featureFlags).toEqual(
      featureFlagsManager.defaultFeatureFlags,
    );
  });

  test("`.featureFlags` uses cookie values over default feature flags", () => {
    // Flip the value of all cookie values
    const defaultFeatureFlags = Object.fromEntries(
      Object.entries(COOKIE_VALUE).map(([key, value]) => [key, !value]),
    );
    jest
      .spyOn(FeatureFlagsManager.prototype, "defaultFeatureFlags", "get")
      .mockReturnValue(defaultFeatureFlags);
    expect(featureFlagsManager.featureFlags).toEqual(COOKIE_VALUE);
  });

  test("`.isFeatureEnabled` correctly interprets values from `.featureFlags`", () => {
    expect(
      Object.keys(featureFlagsManager.featureFlags).length,
    ).toBeGreaterThanOrEqual(1);
    Object.entries(featureFlagsManager.featureFlags).forEach(
      ([name, enabled]) => {
        expect(featureFlagsManager.isFeatureEnabled(name)).toEqual(enabled);
      },
    );
  });

  test("`.isFeatureEnabled` is resilient against cookie value updating from what is cached", () => {
    const currentFeatureFlags = featureFlagsManager.featureFlags;

    const featureFlagToSneakilyUpdateName = Object.keys(
      featureFlagsManager.featureFlags,
    )[0];
    const currentValue = currentFeatureFlags[featureFlagToSneakilyUpdateName];
    expect(
      featureFlagsManager.isFeatureEnabled(featureFlagToSneakilyUpdateName),
    ).toEqual(currentValue);

    // At this point, since the `FeatureFlagsManager` has already been instantiated, we can change the cookie
    // (without going through the manager) and check if it resiliently uses the updated values
    Cookies.set(
      FeatureFlagsManager.FEATURE_FLAGS_KEY,
      JSON.stringify({
        ...currentFeatureFlags,
        [featureFlagToSneakilyUpdateName]: !currentValue,
      }),
    );
    expect(
      featureFlagsManager.isFeatureEnabled(featureFlagToSneakilyUpdateName),
    ).toEqual(!currentValue);
  });

  test("`.isFeatureEnabled` throws an error if accessing an invalid feature flag", () => {
    const fakeFeatureFlag = "someFakeFeatureFlag-------------------";
    expect(
      Object.keys(featureFlagsManager.featureFlags).includes(fakeFeatureFlag),
    ).toEqual(false);
    expect(() =>
      featureFlagsManager.isFeatureEnabled(fakeFeatureFlag),
    ).toThrow();
  });

  test("`.isFeatureDisabled` returns the opposite of `.isFeatureEnabled`", () => {
    expect(
      Object.keys(featureFlagsManager.featureFlags).length,
    ).toBeGreaterThanOrEqual(1);
    Object.keys(featureFlagsManager.featureFlags).forEach((name) => {
      const isEnabled = featureFlagsManager.isFeatureEnabled(name);
      const isDisabled = featureFlagsManager.isFeatureDisabled(name);
      expect(isEnabled).toEqual(!isDisabled);
    });
  });

  test("`.isValidFeatureFlag` correctly identifies valid feature flag names", () => {
    Object.keys(featureFlagsManager.defaultFeatureFlags).forEach((name) => {
      expect(featureFlagsManager.isValidFeatureFlag(name)).toEqual(true);
    });
    const invalidFeatureFlagName = "someInvalidFeatureFlag--------------";
    expect(
      featureFlagsManager.isValidFeatureFlag(invalidFeatureFlagName),
    ).toEqual(false);
  });

  test("`.middleware` processes feature flags from query params", () => {
    const featureFlagName = "feature1";
    const newValue = false;
    expect(DEFAULT_FEATURE_FLAGS[featureFlagName]).not.toEqual(newValue);
    const expectedFeatureFlagsCookie = {
      ...DEFAULT_FEATURE_FLAGS,
      [featureFlagName]: newValue,
    };
    const queryParamString = `${featureFlagName}:${newValue.toString()}`;
    const url = `http://localhost/feature-flags?${FeatureFlagsManager.FEATURE_FLAGS_KEY}=${queryParamString}`;
    const request = new NextRequest(new Request(url), {});
    const mockSet = jest.fn();
    jest
      .spyOn(NextResponse.prototype, "cookies", "get")
      .mockReturnValue({ set: mockSet } as object as NextResponse["cookies"]);
    featureFlagsManager.middleware(request, NextResponse.next());
    expect(mockSet).toHaveBeenCalledWith({
      expires: expect.any(Date) as jest.Expect,
      name: FeatureFlagsManager.FEATURE_FLAGS_KEY,
      value: JSON.stringify(expectedFeatureFlagsCookie),
    });
  });

  test("`.middleware` does not set cookies if production", async () => {
    const url = "http://localhost/feature-flags";
    const request = new NextRequest(new Request(url), {});
    const mockSet = jest.fn();
    jest
      .spyOn(NextResponse.prototype, "cookies", "get")
      .mockReturnValue({ set: mockSet } as object as NextResponse["cookies"]);
    await mockProcessEnv({ NEXT_PUBLIC_APP_ENV: "production" }, () => {
      featureFlagsManager.middleware(request, NextResponse.next());
      expect(mockSet).not.toHaveBeenCalled();
    });
  });

  /**
   * This test is important because there is a race condition between middleware vs frontend cookie
   * setting.
   */
  test("`.middleware` does not set cookies if no valid feature flags are specified in params", async () => {
    const paramValue = "fakeFeature:true;anotherFakeFeature:false";
    const parsedFeatureFlags =
      featureFlagsManager.parseFeatureFlagsFromString(paramValue);
    expect(Object.keys(parsedFeatureFlags).length).toEqual(0);
    const url = `http://localhost/feature-flags?${paramValue}`;
    const request = new NextRequest(new Request(url), {});
    const mockSet = jest.fn();
    jest
      .spyOn(NextResponse.prototype, "cookies", "get")
      .mockReturnValue({ set: mockSet } as object as NextResponse["cookies"]);
    await mockProcessEnv({ NEXT_PUBLIC_APP_ENV: "production" }, () => {
      featureFlagsManager.middleware(request, NextResponse.next());
      expect(mockSet).not.toHaveBeenCalled();
    });
  });

  test("`.parseFeatureFlagsFromString` correctly parses a valid query param string", () => {
    const expectedFeatureFlags = {
      feature1: false,
      feature2: true,
    };
    const validQueryParamString = "feature1:false;feature2:true";
    expect(
      featureFlagsManager.parseFeatureFlagsFromString(validQueryParamString),
    ).toEqual(expectedFeatureFlags);
    const validQueryParamStringWithExtraCharacters =
      ";feature1: false; feature2 : true ;";
    expect(
      featureFlagsManager.parseFeatureFlagsFromString(
        validQueryParamStringWithExtraCharacters,
      ),
    ).toEqual(expectedFeatureFlags);
  });

  test("`.parseFeatureFlagsFromString` returns {} if null param", () => {
    expect(featureFlagsManager.parseFeatureFlagsFromString(null)).toEqual({});
  });

  test("`.parseFeatureFlagsFromString` returns {} if empty string param", () => {
    expect(featureFlagsManager.parseFeatureFlagsFromString("")).toEqual({});
  });

  test.each([
    "sadfkdfj",
    ";;;;;;;;;;;;;",
    "truetruetrue=false",
    "true=false",
    "!@#$%^&*(){}[]:\";|'<.,./?\\`~",
  ])(
    "`.parseFeatureFlagsFromString` gracefully handles garbled values",
    (queryParamString) => {
      const featureFlags =
        featureFlagsManager.parseFeatureFlagsFromString(queryParamString);
      expect(featureFlags).toEqual({});
    },
  );

  test.each([
    ["feature1", "true", true],
    ["invalidFeatureFlag", "true", false],
    ["feature1", "invalidFlagValue", false],
  ])(
    "`.parseFeatureFlagsFromString` omits invalid flag names and values",
    (flagName, flagValue, isValid) => {
      const queryParamString = `${flagName}:${flagValue}`;
      const featureFlags =
        featureFlagsManager.parseFeatureFlagsFromString(queryParamString);
      expect(Object.keys(featureFlags).includes(flagName)).toBe(isValid);
    },
  );

  test("`.setFeatureflag` updates the feature flags", () => {
    const currentFeatureFlags = featureFlagsManager.featureFlags;

    const featureFlagToChangeName = Object.keys(currentFeatureFlags)[0];
    const newFeatureFlagValue = !currentFeatureFlags[featureFlagToChangeName];
    featureFlagsManager.setFeatureFlag(
      featureFlagToChangeName,
      newFeatureFlagValue,
    );

    const expectedNewFeatureFlags = {
      ...currentFeatureFlags,
      [featureFlagToChangeName]: newFeatureFlagValue,
    };
    expect(featureFlagsManager.featureFlagsCookie).toEqual(
      expectedNewFeatureFlags,
    );
    expect(featureFlagsManager.featureFlags).toEqual(expectedNewFeatureFlags);
  });

  test("`.setFeatureflag` throws an error if the feature flag name is invalid", () => {
    const someInvalidFeatureFlag = "someFakeFeatureFlag-------------------";
    expect(
      Object.keys(featureFlagsManager.featureFlags).includes(
        someInvalidFeatureFlag,
      ),
    ).toEqual(false);
    expect(() =>
      featureFlagsManager.setFeatureFlag(someInvalidFeatureFlag, true),
    ).toThrow();
  });

  test("`.setFeatureflag` is resilient against cookie value updating from what is cached", () => {
    const currentFeatureFlags = featureFlagsManager.featureFlags;

    const featureFlagToSneakilyUpdateName = Object.keys(currentFeatureFlags)[0];
    const newFeatureFlagToSneakilyUpdateValue =
      !currentFeatureFlags[featureFlagToSneakilyUpdateName];
    // At this point, since the `FeatureFlagsManager` has already been instantiated, we can change the cookie
    // (without going through the manager) and check if it resiliently uses the updated values
    expect(
      featureFlagsManager.isFeatureEnabled(featureFlagToSneakilyUpdateName),
    ).not.toEqual(newFeatureFlagToSneakilyUpdateValue);
    Cookies.set(
      FeatureFlagsManager.FEATURE_FLAGS_KEY,
      JSON.stringify({
        ...currentFeatureFlags,
        [featureFlagToSneakilyUpdateName]: newFeatureFlagToSneakilyUpdateValue,
      }),
    );

    const featureFlagToChangeName = Object.keys(currentFeatureFlags)[1];
    const newFeatureFlagToChangeValue =
      !currentFeatureFlags[featureFlagToChangeName];
    expect(
      featureFlagsManager.isFeatureEnabled(featureFlagToChangeName),
    ).not.toEqual(newFeatureFlagToChangeValue);
    expect(featureFlagToChangeName).not.toEqual(
      featureFlagToSneakilyUpdateName,
    );
    featureFlagsManager.setFeatureFlag(
      featureFlagToChangeName,
      newFeatureFlagToChangeValue,
    );

    const expectedNewFeatureFlags = {
      ...currentFeatureFlags,
      [featureFlagToSneakilyUpdateName]: newFeatureFlagToSneakilyUpdateValue,
      [featureFlagToChangeName]: newFeatureFlagToChangeValue,
    };
    expect(featureFlagsManager.featureFlagsCookie).toEqual(
      expectedNewFeatureFlags,
    );
    expect(featureFlagsManager.featureFlags).toEqual(expectedNewFeatureFlags);
  });

  describe("Calls feature flag from server component", () => {
    const readonlyCookiesExample = {
      _ff: '{"feature1": true, "feature2": false}',
    };

    test("correctly initializes from ReadonlyRequestCookies", () => {
      const readonlyCookies = readonlyCookiesExample;
      const featureFlagsManager = new FeatureFlagsManager(readonlyCookies);

      expect(featureFlagsManager.isFeatureEnabled("feature1")).toBe(true);
      expect(featureFlagsManager.isFeatureEnabled("feature2")).toBe(false);
    });

    test("throws error for invalid feature flag in ReadonlyRequestCookies", () => {
      const invalidFlagCookies = {
        _ff: '{"invalidFeature": true}',
      };

      const featureFlagsManager = new FeatureFlagsManager(invalidFlagCookies);

      // Accessing an invalid feature flag throws an error
      expect(() =>
        featureFlagsManager.isFeatureEnabled("invalidFeature"),
      ).toThrow();
    });

    test("`searchParams` override takes precedence over default and cookie-based feature flags", () => {
      // Set a different state in cookies to test precedence
      const modifiedCookieValue = { feature1: true };
      mockFeatureFlagsCookie(modifiedCookieValue);
      const serverFeatureFlagsManager = new FeatureFlagsManager(
        MockServerCookiesModule,
      );

      // Now provide searchParams with a conflicting setup
      const searchParams = {
        _ff: "feature1:false",
      };

      expect(
        serverFeatureFlagsManager.isFeatureEnabled("feature1", searchParams),
      ).toBe(false);

      expect(
        serverFeatureFlagsManager.isFeatureDisabled("feature1", searchParams),
      ).toBe(true);
    });
  });
});

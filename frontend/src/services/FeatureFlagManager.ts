/**
 * @file Service for checking and managing feature flags
 */

import { CookiesStatic } from "js-cookie";
import { defaultFeatureFlags } from "src/constants/defaultFeatureFlags";
import { featureFlags } from "src/constants/environments";
import { ServerSideSearchParams } from "src/types/searchRequestURLTypes";

import { ReadonlyRequestCookies } from "next/dist/server/web/spec-extension/adapters/request-cookies";
import { NextRequest, NextResponse } from "next/server";

export type FeatureFlags = { [name: string]: boolean };

// Parity with unexported getServerSideProps context cookie type
export type ExpansiveCookieType =
  // | Partial<{
  //     [key: string]: string;
  //   }>
  NextRequest["cookies"] | CookiesStatic | ReadonlyRequestCookies;

export const FEATURE_FLAGS_KEY = "_ff";

// 3 months
export const getCookieExpiration = () =>
  new Date(Date.now() + 1000 * 60 * 60 * 24 * 90);

/**
 * Check whether it is a valid feature flag.
 */
function isValidFeatureFlag(name: string): boolean {
  return Object.keys(defaultFeatureFlags).includes(name);
}

/**
 * Parses feature flags from a query param string
 */
function parseFeatureFlagsFromString(
  queryParamString: string | null,
): FeatureFlags {
  if (!queryParamString) {
    return {};
  }
  const entries = queryParamString
    .split(";")
    // Remove any non-standard formatted strings; must be in the format 'key:value'
    .filter((value) => {
      const splitValue = value.split(":");
      if (splitValue.length < 2 || splitValue.length > 2) {
        return false;
      }
      return true;
    })
    // Convert 'key:value' to ['key', 'value']
    .map((value) => {
      const [paramName, paramValue] = value.split(":");
      return [paramName.trim(), paramValue.trim()];
    })
    // Remove any invalid feature flags or feature flag values
    .filter(([paramName, paramValue]) => {
      // Prevent someone from setting arbitrary feature flags, which is usually an accident
      if (!isValidFeatureFlag(paramName)) {
        return false;
      }
      if (!["true", "false"].includes(paramValue)) {
        return false;
      }
      return true;
    })
    // Convert string to bool
    .map(([paramName, paramValue]) => [paramName, paramValue === "true"]);
  return Object.fromEntries(entries) as FeatureFlags;
}

/**
 * Set a cookie using the NextResponse['cookies'] interface
 * May need to expand this typing to allow for use on the client side, but we can think about that later
 */
function setCookie(value: string, cookies: NextResponse["cookies"]) {
  const expires = getCookieExpiration();
  if (cookies && "remove" in cookies) {
    // CookiesStatic
    cookies.set(FEATURE_FLAGS_KEY, value, { expires });
  } else {
    // Next.js cookies API
    cookies?.set({
      name: FEATURE_FLAGS_KEY,
      value,
      expires,
    });
  }
}

/**
 * Return the value of the parsed feature flag cookie.
 *
 * This returns {} if the cookie value is not parsable.
 * Invalid flag names and flag values are removed.
 */
function getFeatureFlagsFromCookie(
  cookies: NextRequest["cookies"] | ReadonlyRequestCookies,
): FeatureFlags {
  if (!cookies) {
    return {};
  }
  let cookieValue;
  let parsedCookie: FeatureFlags;

  cookieValue = cookies.get(FEATURE_FLAGS_KEY);

  if (typeof cookieValue === "object") {
    cookieValue = cookieValue.value;
  }
  try {
    if (cookieValue) {
      parsedCookie = JSON.parse(cookieValue) as FeatureFlags;
      if (typeof parsedCookie !== "object" || Array.isArray(parsedCookie)) {
        parsedCookie = {};
      }
    } else {
      parsedCookie = {};
    }
  } catch (error) {
    // Something went wrong with getting this value, so we assume the cookie is blank
    // eslint-disable-next-line no-console
    console.error(error);
    parsedCookie = {};
  }

  return Object.fromEntries(
    Object.entries(parsedCookie).filter(([name, enabled]) => {
      return isValidFeatureFlag(name) && typeof enabled === "boolean";
    }),
  );
}

/**
 * Class for reading and managing feature flags on the server.
 *
 * Holds default and env var based values in class, and exposes two functions:
 *
 * - middleware: for use in setting feature flags on cookies in next middleware
 * - isFeatureEnabled: for checking if a feature is currently enabled, requires
 * passing in existing request cookies
 */
export class FeatureFlagsManager {
  // Define all feature flags here! You can override these in your
  // browser, once a default is defined here.
  private _defaultFeatureFlags = defaultFeatureFlags;

  // pass in env var values at instantiation, as these won't change during runtime
  // this supports easier integration of the class on the client side, as server side flags can be passed down
  private _envVarFlags;

  constructor(envVarFlags: FeatureFlags) {
    this._envVarFlags = envVarFlags;
  }

  get defaultFeatureFlags(): FeatureFlags {
    return { ...this._defaultFeatureFlags };
  }

  private get featureFlagsFromEnvironment(): FeatureFlags {
    return { ...this._envVarFlags };
  }

  /*

    - Flags set by environment variables are the first override to default values
    - Flags set in the /dev/feature-flags admin view will be set in the cookie
    - Flags set in query params will result in the flag value being stored in the cookie
    - As query param values are set in middleware on each request, query params have the highest precedence
    - Values set in cookies will be persistent per browser session unless explicitly overwritten
    - This means that simply removing a query param from a url will not revert the feature flag value to
    the value specified in environment variable or default, you'll need to clear cookies or open a new private browser

  */
  private get featureFlags(): FeatureFlags {
    return {
      ...this.defaultFeatureFlags,
      ...this.featureFlagsFromEnvironment,
    };
  }

  /**
   * Check whether a feature flag is enabled
   * @param name - Feature flag name
   * @example isFeatureEnabled("featureFlagName")
   */
  isFeatureEnabled(
    name: string,
    cookies: NextRequest["cookies"] | ReadonlyRequestCookies,
    searchParams?: ServerSideSearchParams,
    // need to incorporate cookies here
  ): boolean {
    if (!isValidFeatureFlag(name)) {
      throw new Error(`\`${name}\` is not a valid feature flag`);
    }

    // Start with the default feature flag setting
    const currentFeatureFlags = {
      ...this.featureFlags,
      ...getFeatureFlagsFromCookie(cookies),
    };
    let featureFlagBoolean = currentFeatureFlags[name];

    // Query params take precedent. Override the returned value if we see them
    if (searchParams && searchParams._ff) {
      const featureFlagsObject = parseFeatureFlagsFromString(searchParams._ff);
      featureFlagBoolean = featureFlagsObject[name];
    }

    return featureFlagBoolean;
  }

  /**
   * Load feature flags from query params and set them on the cookie. This allows for
   * feature flags to be set via url query params as well.
   *
   * Expects a query string with a param of `FEATURE_FLAGS_KEY`.
   *
   * For example, `example.com?_ff=showSite:true;enableClaimFlow:false`
   * would enable `showSite` and disable `enableClaimFlow`.
   */
  middleware(request: NextRequest, response: NextResponse): NextResponse {
    // handle query param
    const paramValue = request.nextUrl.searchParams.get(FEATURE_FLAGS_KEY);

    const featureFlagsFromQuery =
      paramValue === "reset"
        ? this.defaultFeatureFlags
        : parseFeatureFlagsFromString(paramValue);

    // no need to set cookie if no feature flags are set
    if (
      Object.keys(featureFlagsFromQuery).length === 0 &&
      this.featureFlags === this._defaultFeatureFlags
    ) {
      // No valid feature flags specified
      return response;
    }

    // create new cookie value based on calculated feature flags
    const featureFlags = {
      ...this.featureFlags,
      ...getFeatureFlagsFromCookie(request.cookies),
      ...featureFlagsFromQuery,
    };

    // set new cookie on response
    setCookie(JSON.stringify(featureFlags), response.cookies);

    return response;
  }
}

export const featureFlagsManager = new FeatureFlagsManager(featureFlags);

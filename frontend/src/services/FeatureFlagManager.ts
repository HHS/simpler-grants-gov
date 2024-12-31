/**
 * @file Service for checking and managing feature flags
 */

import { CookiesStatic } from "js-cookie";
import { featureFlags } from "src/constants/featureFlags";
import { ServerSideSearchParams } from "src/types/searchRequestURLTypes";

import { ReadonlyRequestCookies } from "next/dist/server/web/spec-extension/adapters/request-cookies";
import { NextRequest, NextResponse } from "next/server";

export type FeatureFlags = { [name: string]: boolean };
// Parity with unexported getServerSideProps context cookie type
export type NextServerSideCookies = Partial<{
  [key: string]: string;
}>;

/**
 * Class for reading and managing feature flags.
 *
 * Server-side:
 *
 *   You can use this manager to gate features on the backend.
 *
 *   ```
 *   export default async function handler(request, response) {
 *     const featureFlagsManager = new FeatureFlagsManager({ cookies: request.cookies })
 *     if (featureFlagsManager.isFeatureEnabled("someFeatureFlag")) {
 *       // Do something
 *     }
 *     ...
 *   }
 *   ```
 *
 * Client-side:
 *
 *   While this manager can be used client-side, it is recommended that you use
 *   the `useFeatureFlags` hook to simplify instantiation and updating of react
 *   state. Here's how you can use it directly.
 *
 *   ```
 *   const featureFlagsManager = new FeatureFlagsManager({ cookies: Cookies })
 *   if (featureFlagsManager.isFeatureEnabled("someFeatureflag")) {
 *     // Do something
 *   }
 *   ```
 *
 */
export class FeatureFlagsManager {
  static FEATURE_FLAGS_KEY = "_ff";

  // Define all feature flags here! You can override these in your
  // browser, once a default is defined here.
  private _defaultFeatureFlags = featureFlags;

  private _cookies;

  // pass in env var values at instantiation, as these won't change during runtime
  // this supports easier integration of the class on the client side, as server side flags can be passed down
  private _envVarFlags;

  constructor({
    cookies,
    envVarFlags,
  }: {
    cookies?:
      | NextRequest["cookies"]
      | CookiesStatic
      | NextServerSideCookies
      | ReadonlyRequestCookies;
    envVarFlags: FeatureFlags;
  }) {
    this._cookies = cookies;
    this._envVarFlags = envVarFlags;
  }

  get defaultFeatureFlags(): FeatureFlags {
    return { ...this._defaultFeatureFlags };
  }

  get featureFlagsFromEnvironment(): FeatureFlags {
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
  get featureFlags(): FeatureFlags {
    // eslint-disable-next-line
    console.log("$$$ in manager", {
      ...this.defaultFeatureFlags,
      ...this.featureFlagsFromEnvironment,
      ...this.featureFlagsCookie,
    });
    return {
      ...this.defaultFeatureFlags,
      ...this.featureFlagsFromEnvironment,
      ...this.featureFlagsCookie,
    };
  }

  /**
   * Return the value of the parsed feature flag cookie.
   *
   * This returns {} if the cookie value is not parsable.
   * Invalid flag names and flag values are removed.
   */
  get featureFlagsCookie(): FeatureFlags {
    if (!this._cookies) {
      return {};
    }
    let cookieValue;
    let parsedCookie: FeatureFlags;

    cookieValue = this.isCookieARecord(this._cookies)
      ? this._cookies[FeatureFlagsManager.FEATURE_FLAGS_KEY]
      : this._cookies.get(FeatureFlagsManager.FEATURE_FLAGS_KEY);

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
        return this.isValidFeatureFlag(name) && typeof enabled === "boolean";
      }),
    );
  }

  /**
   * Check whether a feature flag is enabled
   * @param name - Feature flag name
   * @example isFeatureEnabled("featureFlagName")
   */
  isFeatureEnabled(
    name: string,
    searchParams?: ServerSideSearchParams,
  ): boolean {
    if (!this.isValidFeatureFlag(name)) {
      throw new Error(`\`${name}\` is not a valid feature flag`);
    }

    // Start with the default feature flag setting
    const currentFeatureFlags = this.featureFlags;
    let featureFlagBoolean = currentFeatureFlags[name];

    // Query params take precedent. Override the returned value if we see them
    if (searchParams && searchParams._ff) {
      const featureFlagsObject = this.parseFeatureFlagsFromString(
        searchParams._ff,
      );
      featureFlagBoolean = featureFlagsObject[name];
    }

    return featureFlagBoolean;
  }

  /**
   * Check whether it is a valid feature flag.
   */
  isValidFeatureFlag(name: string): boolean {
    return Object.keys(this.defaultFeatureFlags).includes(name);
  }

  /**
   * Load feature flags from query params and set them on the cookie. This allows for
   * feature flags to be set via url query params as well.
   *
   * Expects a query string with a param of `FeatureFlagsManager.FEATURE_FLAGS_KEY`.
   *
   * For example, `example.com?_ff=showSite:true;enableClaimFlow:false`
   * would enable `showSite` and disable `enableClaimFlow`.
   */
  middleware(request: NextRequest, response: NextResponse): NextResponse {
    // handle query param
    const paramValue = request.nextUrl.searchParams.get(
      FeatureFlagsManager.FEATURE_FLAGS_KEY,
    );

    const featureFlagsFromQuery =
      paramValue === "reset"
        ? this.defaultFeatureFlags
        : this.parseFeatureFlagsFromString(paramValue);

    // no need to set cookie if no feature flags are set
    if (
      Object.keys(featureFlagsFromQuery).length === 0 &&
      this.featureFlags === this._defaultFeatureFlags
    ) {
      // No valid feature flags specified
      return response;
    }

    const featureFlags = {
      ...this.featureFlags,
      ...featureFlagsFromQuery,
    };

    console.log("$$$ setting feature flag cookie in middleware", featureFlags);
    // set cookie
    Object.entries(featureFlags).forEach(([flagName, flagValue]) => {
      this.setFeatureFlagCookie(flagName, flagValue);
    });
    this.setCookie(JSON.stringify(this.featureFlagsCookie), response.cookies);

    return response;
  }

  /**
   * Parses feature flags from a query param string
   * * should be removed from this class
   */
  parseFeatureFlagsFromString(queryParamString: string | null): FeatureFlags {
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
        if (!this.isValidFeatureFlag(paramName)) {
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
   * Toggle feature flag on cookie
   */
  setFeatureFlagCookie(featureName: string, enabled: boolean): void {
    if (!this.isValidFeatureFlag(featureName)) {
      throw new Error(`\`${featureName}\` is not a valid feature flag`);
    }
    const featureFlags = {
      ...this.featureFlagsCookie,
      [featureName]: enabled,
    };

    this.setCookie(JSON.stringify(featureFlags));
  }

  /**
   * Set a cookie using the NextRequest['cookies'] interface
   * or the CookiesStatic interface.
   */
  private setCookie(
    value: string,
    cookies?: CookiesStatic | NextRequest["cookies"] | NextResponse["cookies"],
  ) {
    // 3 months
    const expires = new Date(Date.now() + 1000 * 60 * 60 * 24 * 90);

    if (!cookies && !this.isCookieARecord(this._cookies)) {
      cookies = this._cookies;
    }

    if (cookies && "remove" in cookies) {
      // CookiesStatic
      cookies.set(FeatureFlagsManager.FEATURE_FLAGS_KEY, value, { expires });
    } else {
      // Next.js cookies API
      cookies?.set({
        name: FeatureFlagsManager.FEATURE_FLAGS_KEY,
        value,
        expires,
      });
    }
  }

  // The SSR function getServerSideProps provides a Record type for cookie, which excludes
  // cookie methods like set or get.
  // likely should be moved out of this class
  private isCookieARecord(
    cookies?: typeof this._cookies | NextResponse["cookies"],
  ): cookies is NextServerSideCookies {
    return !(cookies && "get" in cookies && typeof cookies.get === "function");
  }
}

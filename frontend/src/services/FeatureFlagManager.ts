/**
 * @file Service for checking and managing feature flags
 */

import { CookiesStatic } from "js-cookie";
import { featureFlags } from "src/constants/featureFlags";

import { ReadonlyRequestCookies } from "next/dist/server/web/spec-extension/adapters/request-cookies";
import { NextRequest, NextResponse } from "next/server";

import { ServerSideSearchParams } from "../types/searchRequestURLTypes";

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
 *     const featureFlagsManager = new FeatureFlagsManager(request.cookies)
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
 *   const featureFlagsManager = new FeatureFlagsManager(Cookies)
 *   if (featureFlagsManager.isFeatureEnabled("someFeatureflag")) {
 *     // Do something
 *   }
 *   ```
 */
export class FeatureFlagsManager {
  static FEATURE_FLAGS_KEY = "_ff";

  // Define all feature flags here! You can override these in your
  // browser, once a default is defined here.
  private _defaultFeatureFlags = featureFlags;

  private _cookies;

  constructor(
    cookies:
      | NextRequest["cookies"]
      | CookiesStatic
      | NextServerSideCookies
      | ReadonlyRequestCookies,
  ) {
    this._cookies = cookies;
  }

  get defaultFeatureFlags(): FeatureFlags {
    return { ...this._defaultFeatureFlags };
  }

  // The SSR function getServerSideProps provides a Record type for cookie, which excludes
  // cookie methods like set or get.
  private isCookieARecord(
    cookies?: typeof this._cookies | NextResponse["cookies"],
  ): cookies is NextServerSideCookies {
    return !(cookies && "get" in cookies && typeof cookies.get === "function");
  }

  /**
   * Return the value of the parsed feature flag cookie.
   *
   * This returns {} if the cookie value is not parsable.
   * Invalid flag names and flag values are removed.
   */
  get featureFlagsCookie(): FeatureFlags {
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

  get featureFlags(): FeatureFlags {
    return {
      ...this.defaultFeatureFlags,
      ...this.featureFlagsCookie,
    };
  }

  /**
   * Check whether a feature flag is disabled
   * @param name - Feature flag name
   * @example isFeatureEnabled("featureFlagName")
   */
  isFeatureDisabled(
    name: string,
    searchParams?: ServerSideSearchParams,
  ): boolean {
    return !this.isFeatureEnabled(name, searchParams);
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
   * Expects a querystring with a param of `FeatureFlagsManager.FEATURE_FLAGS_KEY`.
   *
   * For example, `example.com?_ff=showSite:true;enableClaimFlow:false`
   * would enable `showSite` and disable `enableClaimFlow`.
   */
  middleware(request: NextRequest, response: NextResponse): NextResponse {
    const paramValue = request.nextUrl.searchParams.get(
      FeatureFlagsManager.FEATURE_FLAGS_KEY,
    );

    const featureFlags =
      paramValue === "reset"
        ? this.defaultFeatureFlags
        : this.parseFeatureFlagsFromString(paramValue);
    if (Object.keys(featureFlags).length === 0) {
      // No valid feature flags specified
      return response;
    }
    Object.entries(featureFlags).forEach(([flagName, flagValue]) => {
      this.setFeatureFlag(flagName, flagValue);
    });
    this.setCookie(JSON.stringify(this.featureFlagsCookie), response.cookies);
    return response;
  }

  /**
   * Parses feature flags from a query param string
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
   * Toggle feature flag
   */
  setFeatureFlag(featureName: string, enabled: boolean): void {
    if (!this.isValidFeatureFlag(featureName)) {
      throw new Error(`\`${featureName}\` is not a valid feature flag`);
    }
    const featureFlags = {
      ...this.featureFlags,
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
}

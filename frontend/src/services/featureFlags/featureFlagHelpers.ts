import {
  defaultFeatureFlags,
  FeatureFlags,
} from "src/constants/defaultFeatureFlags";

import { ReadonlyRequestCookies } from "next/dist/server/web/spec-extension/adapters/request-cookies";
import { NextRequest, NextResponse } from "next/server";

export const FEATURE_FLAGS_KEY = "_ff";

// 3 months
export const getCookieExpiration = () =>
  new Date(Date.now() + 1000 * 60 * 60 * 24 * 90);

/**
 * Check whether it is a valid feature flag.
 */
export function isValidFeatureFlag(name: string): boolean {
  return Object.keys(defaultFeatureFlags).includes(name);
}

/**
 * Parses feature flags from a query param string
 */
export function parseFeatureFlagsFromString(
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
 */
export function setCookie(value: string, cookies: NextResponse["cookies"]) {
  const expires = getCookieExpiration();
  cookies?.set({
    name: FEATURE_FLAGS_KEY,
    value,
    expires,
  });
}

/**
 * Return the value of the parsed feature flag cookie.
 *
 * This returns {} if the cookie value is not parsable.
 * Invalid flag names and flag values are removed.
 */
export function getFeatureFlagsFromCookie(
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

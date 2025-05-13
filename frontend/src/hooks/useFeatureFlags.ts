"use client";

import Cookies from "js-cookie";
import { isBoolean } from "lodash";
import {
  defaultFeatureFlags,
  FeatureFlags,
} from "src/constants/defaultFeatureFlags";
import {
  FEATURE_FLAGS_KEY,
  getCookieExpiration,
} from "src/services/featureFlags/featureFlagHelpers";

import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

/**
 * Allows client components to access feature flags by
 *  - setting the cookie
 *  - reading the cookie
 *
 */
export function useFeatureFlags(): {
  setFeatureFlag: (flagName: string, value: boolean) => void;
  checkFeatureFlag: (flagName: string) => boolean;
  createQueryString: (name: string, value: string) => string;
  featureFlags: FeatureFlags;
} {
  const searchParams = useSearchParams();
  const [featureFlags, setFeatureFlags] =
    useState<FeatureFlags>(defaultFeatureFlags);

  // a workaround, as setting this in default state value results in hydration error
  useEffect(() => {
    const flagsFromCookie = JSON.parse(
      Cookies.get(FEATURE_FLAGS_KEY) || "{}",
    ) as FeatureFlags;
    setFeatureFlags(flagsFromCookie);
  }, []);

  // Note that values set in cookies will be persistent per browser session unless explicitly overwritten
  const setFeatureFlag = useCallback(
    (flagName: string, value: boolean) => {
      const newFlags = {
        ...featureFlags,
        [flagName]: value,
      };
      setFeatureFlags(newFlags);
      Cookies.set(FEATURE_FLAGS_KEY, JSON.stringify(newFlags), {
        expires: getCookieExpiration(),
      });
    },
    [featureFlags, setFeatureFlags],
  );

  const createQueryString = useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set(name, value);
      return params.toString();
    },
    [searchParams],
  );

  const checkFeatureFlag = useCallback(
    (flagName: string): boolean => {
      const value = featureFlags[flagName];
      if (!isBoolean(value)) {
        console.error("Unknown or misconfigured feature flag: ", flagName);
        return false;
      }
      return value;
    },
    [featureFlags],
  );

  return {
    setFeatureFlag,
    checkFeatureFlag,
    createQueryString,
    featureFlags,
  };
}

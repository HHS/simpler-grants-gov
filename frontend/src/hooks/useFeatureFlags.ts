"use client";

import Cookies from "js-cookie";
import { isBoolean } from "lodash";
import {
  defaultFeatureFlags,
  FeatureFlags,
} from "src/constants/defaultFeatureFlags";
import {
  FEATURE_FLAGS_DEFAULTS_KEY,
  FEATURE_FLAGS_KEY,
  getCookieExpiration,
} from "src/services/featureFlags/featureFlagHelpers";

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
  featureFlags: FeatureFlags;
  userSetFlags: FeatureFlags;
  defaultFlags: FeatureFlags;
} {
  const [featureFlags, setFeatureFlags] =
    useState<FeatureFlags>(defaultFeatureFlags);
  const [userSetFlags, setUserSetFlags] = useState<FeatureFlags>({});
  const [defaultFlags, setDefaultFlags] = useState<FeatureFlags>({});

  // a workaround, as setting this in default state value results in hydration error
  useEffect(() => {
    const flagsFromCookie = {
      ...JSON.parse(Cookies.get(FEATURE_FLAGS_DEFAULTS_KEY) || "{}"),
      ...JSON.parse(Cookies.get(FEATURE_FLAGS_KEY) || "{}"),
    } as FeatureFlags;
    setFeatureFlags(flagsFromCookie);
  }, []);

  // a workaround, as setting this in default state value results in hydration error
  useEffect(() => {
    const flagsFromCookie = {
      ...JSON.parse(Cookies.get(FEATURE_FLAGS_KEY) || "{}"),
    } as FeatureFlags;
    setUserSetFlags(flagsFromCookie);
  }, []);

  // a workaround, as setting this in default state value results in hydration error
  useEffect(() => {
    const flagsFromCookie = {
      ...JSON.parse(Cookies.get(FEATURE_FLAGS_DEFAULTS_KEY) || "{}"),
    } as FeatureFlags;
    setDefaultFlags(flagsFromCookie);
  }, []);

  // Note that values set in cookies will be persistent per browser session unless explicitly overwritten
  const setFeatureFlag = useCallback(
    (flagName: string, value: boolean) => {
      const newUserSetFlags = {
        ...userSetFlags,
        [flagName]: value,
      };

      const newFlags = {
        ...featureFlags,
        ...newUserSetFlags,
      };

      setFeatureFlags(newFlags);
      setUserSetFlags(newUserSetFlags);

      Cookies.set(FEATURE_FLAGS_KEY, JSON.stringify(newUserSetFlags), {
        expires: getCookieExpiration(),
      });
    },
    [featureFlags, userSetFlags],
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
    featureFlags,
    userSetFlags,
    defaultFlags,
  };
}

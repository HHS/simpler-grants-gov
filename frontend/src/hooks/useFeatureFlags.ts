"use client";

import Cookies from "js-cookie";
import { isBoolean } from "lodash";
import {
  FEATURE_FLAGS_KEY,
  getCookieExpiration,
} from "src/services/FeatureFlagManager";

import { useCallback, useState } from "react";

/**
 * needs to be able to
 *  - set the cookie
 *  - read the cookie
 *
 * does not need access to anything else
 */
export function useFeatureFlags() {
  const [featureFlags, setFeatureFlags] = useState(
    JSON.parse(Cookies.get(FEATURE_FLAGS_KEY) || "{}"),
  );

  const setFeatureFlag = useCallback(
    (flagName: string, value: boolean) => {
      const newFlags = {
        ...featureFlags,
        [flagName]: value,
      };
      console.log("$$$ setting flag client side", newFlags);
      setFeatureFlags(newFlags);
      Cookies.set(FEATURE_FLAGS_KEY, JSON.stringify(newFlags), {
        expires: getCookieExpiration(),
      });
    },
    [featureFlags, setFeatureFlags],
  );

  const checkFeatureFlag = useCallback(
    (flagName: string): boolean => {
      const value = featureFlags[flagName];
      console.log("$$$ reading flag client side", flagName, value);
      if (!isBoolean(value)) {
        // why is this running on build?
        // cookie will not be available at build time\
        // if this will go through the build we should figure out how to avoid polluting the logs
        console.error("Unknown or misconfigured feature flag: ", flagName);
      }
      return value;
    },
    [featureFlags],
  );

  return {
    setFeatureFlag,
    checkFeatureFlag,
    featureFlags,
  };
}

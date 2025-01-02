"use client";

import Cookies from "js-cookie";
import { isBoolean } from "lodash";
import { FeatureFlags } from "src/constants/defaultFeatureFlags";
import {
  FEATURE_FLAGS_KEY,
  getCookieExpiration,
} from "src/services/featureFlags/featureFlagHelpers";

import { useCallback, useState } from "react";

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
} {
  const [featureFlags, setFeatureFlags] = useState<FeatureFlags>(
    JSON.parse(Cookies.get(FEATURE_FLAGS_KEY) || "{}") as FeatureFlags,
  );

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

  const checkFeatureFlag = useCallback(
    (flagName: string): boolean => {
      if (!featureFlags || !Object.keys(featureFlags).length) {
        // note that this hook will run on the server when building client components server side
        // but will only return initial default values and will not have access to client side cookies
        // eslint-disable-next-line
        console.debug(
          "Feature flags not present. Likely attempting to run client side hook on server",
        );
        return false;
      }
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
  };
}

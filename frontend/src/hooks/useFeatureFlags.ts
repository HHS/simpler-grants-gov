"use client";

import { isBoolean } from "lodash";
import { FeatureFlags } from "src/constants/defaultFeatureFlags";
import { useUser } from "src/services/auth/useUser";

import { usePathname, useRouter } from "next/navigation";
import { useCallback } from "react";

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
  defaultFeatureFlags: FeatureFlags;
} {
  const userContext = useUser();
  const pathname = usePathname() || "";
  const router = useRouter();

  const setFeatureFlag = (flagName: string, value: boolean) => {
    const params = new URLSearchParams();
    params.set("_ff", `${flagName}:${value ? "true" : "false"}`);
    router.push(`${pathname}?${params.toString()}`);
  };

  const checkFeatureFlag = useCallback(
    (flagName: string): boolean => {
      const value = userContext.featureFlags[flagName];

      if (!isBoolean(value)) {
        console.error(
          "Unknown or misconfigured feature flag: ",
          flagName,
          value,
        );
        return false;
      }
      return value;
    },
    [userContext.featureFlags],
  );

  return {
    setFeatureFlag,
    checkFeatureFlag,
    featureFlags: userContext.featureFlags,
    defaultFeatureFlags: userContext.defaultFeatureFlags,
  };
}

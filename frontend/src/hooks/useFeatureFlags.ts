import Cookies from "js-cookie";
import { featureFlags } from "src/constants/environments";
import { FeatureFlagsManager } from "src/services/FeatureFlagManager";
import { FeatureFlagContext } from "src/services/featureFlags/FeatureFlagProvider";

import { useContext, useEffect, useState } from "react";

/**
 * React hook for reading and managing feature flags in client-side code.
 *
 * ```
 * function MyComponent() {
 *   const {
 *     featureFlagsManager,  // An instance of FeatureFlagsManager
 *     mounted,  // Useful for hydration
 *     setFeatureFlag,  // Proxy for featureFlagsManager.setFeatureFlagCookie that handles updating state
 *   } = useFeatureFlags()
 *
 *   if (featureFlagsManager.isFeatureEnabled("someFeatureFlag")) {
 *     // Do something
 *   }
 *
 *   if (!mounted) {
 *     // To allow hydration
 *     return null
 *   }
 *
 *   return (
 *     ...
 *   )
 * }
 * ```
 */
export function useFeatureFlags() {
  const envVarFlags = useContext(FeatureFlagContext);
  // eslint-disable-next-line
  console.log("$$$ in hook", envVarFlags);
  const [featureFlagsManager, setFeatureFlagsManager] = useState(
    new FeatureFlagsManager({ cookies: Cookies, envVarFlags }),
  );
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  function setFeatureFlag(name: string, value: boolean) {
    featureFlagsManager.setFeatureFlagCookie(name, value);
    setFeatureFlagsManager(
      new FeatureFlagsManager({ cookies: Cookies, envVarFlags: featureFlags }),
    );
  }

  return {
    featureFlagsManager,
    mounted,
    setFeatureFlag,
    currentFeatureFlags: featureFlagsManager.featureFlags,
  };
}

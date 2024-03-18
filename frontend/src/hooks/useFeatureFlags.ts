import Cookies from "js-cookie";

import { useEffect, useState } from "react";

import { FeatureFlagsManager } from "../services/FeatureFlagManager";

/**
 * React hook for reading and managing feature flags in client-side code.
 *
 * ```
 * function MyComponent() {
 *   const {
 *     featureFlagsManager,  // An instance of FeatureFlagsManager
 *     mounted,  // Useful for hydration
 *     setFeatureFlag,  // Proxy for featureFlagsManager.setFeatureFlag that handles updating state
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
  const [featureFlagsManager, setFeatureFlagsManager] = useState(
    new FeatureFlagsManager(Cookies),
  );
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  function setFeatureFlag(name: string, value: boolean) {
    featureFlagsManager.setFeatureFlag(name, value);
    setFeatureFlagsManager(new FeatureFlagsManager(Cookies));
  }

  return { featureFlagsManager, mounted, setFeatureFlag };
}

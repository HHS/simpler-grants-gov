"use client";

import { useFeatureFlags } from "src/hooks/useFeatureFlags";

import { useEffect } from "react";

/**
 * Checks for the "major" features being offline, otherwise we're not in maintenance, so redir to homepage.
 */
export default function ClientMaintenanceCheck() {
  const {
    checkFeatureFlag, // An instance of FeatureFlagsManager
  } = useFeatureFlags();

  useEffect(() => {
    if (
      !checkFeatureFlag("searchOff") &&
      !checkFeatureFlag("opportunityOff") &&
      checkFeatureFlag("authOn")
    ) {
      // This piece does not seem reliable, maybe due to re-render or rehyrdrate cylces where we redirect away before the actual client live feature flag is set
      // redirect("/", RedirectType.push);
    }
  }, [checkFeatureFlag]);

  return null;
}

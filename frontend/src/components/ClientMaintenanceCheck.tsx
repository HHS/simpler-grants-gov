"use client";

import { useFeatureFlags } from "src/hooks/useFeatureFlags";

import { redirect, RedirectType } from "next/navigation";
import { useEffect } from "react";

/**
 * View for managing feature flags
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
      // console.log("would redir");
      redirect("/", RedirectType.push);
    }
  }, [checkFeatureFlag]);

  return null;
}

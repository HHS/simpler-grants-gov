"use client";

import { useFeatureFlags } from "src/hooks/useFeatureFlags";

import { redirect, RedirectType } from "next/navigation";
import { useEffect } from "react";

/**
 * Checks for the "major" features being offline, otherwise we're not in maintenance, so redir to homepage.
 */
export default function ClientMaintenanceCheck() {
  const {
    checkFeatureFlag, // An instance of FeatureFlagsManager
  } = useFeatureFlags();

  useEffect(() => {
    console.dir({
      msg: "redir",
      search: !checkFeatureFlag("searchOff"),
      opp: !checkFeatureFlag("opportunityOff"),
      auth: checkFeatureFlag("authOn"),
    });

    if (
      !checkFeatureFlag("searchOff") &&
      !checkFeatureFlag("opportunityOff") &&
      checkFeatureFlag("authOn")
    ) {
      redirect("/", RedirectType.push);
    }
  }, [checkFeatureFlag]);

  return null;
}

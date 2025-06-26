import { Metadata } from "next";

import Head from "next/head";
import React from "react";
import { Button } from "@trussworks/react-uswds";

import FeatureFlagsTable from "src/components/dev/FeatureFlagsTable";

export function generateMetadata() {
  const meta: Metadata = {
    title: "Feature flag manager",
  };

  return meta;
}

/**
 * View for managing feature flags
 */
export default function FeatureFlags() {
  return (
    <>
      <Head>
        <title>Manage Feature Flags</title>
      </Head>
      <div className="grid-container">
        <h1>Manage Feature Flags</h1>

        <FeatureFlagsTable />

        <a href="?_ff=reset">
          <Button type="button" data-testid="reset-defaults">
            Reset all flags to defaults
          </Button>
        </a>
      </div>
    </>
  );
}

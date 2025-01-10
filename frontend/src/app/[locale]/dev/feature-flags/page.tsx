import { Metadata } from "next";
import FeatureFlagsTable from "src/app/[locale]/dev/feature-flags/FeatureFlagsTable";

import Head from "next/head";
import React from "react";

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
      <div>
        <h1>Manage Feature Flags</h1>
        <FeatureFlagsTable />
      </div>
    </>
  );
}

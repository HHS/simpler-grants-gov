import { Metadata } from "next";

import Head from "next/head";
import React from "react";
import FeatureFlagsTable from "./FeatureFlagsTable";

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

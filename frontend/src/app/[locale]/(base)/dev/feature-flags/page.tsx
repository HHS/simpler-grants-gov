import { Metadata } from "next";
import withFeatureFlag from "src/services/featureFlags/withFeatureFlag";
import { WithFeatureFlagProps } from "src/types/uiTypes";

import Head from "next/head";
import Link from "next/link";
import { notFound } from "next/navigation";
import React from "react";
import { Button } from "@trussworks/react-uswds";

import FeatureFlagsTable from "src/components/dev/FeatureFlagsTable";

export function generateMetadata() {
  const meta: Metadata = {
    title: "Feature flag manager",
  };

  return meta;
}

type FeatureFlagsProps = WithFeatureFlagProps;

/**
 * View for managing feature flags
 */
function FeatureFlags() {
  return (
    <>
      <Head>
        <title>Manage Feature Flags</title>
      </Head>
      <div className="grid-container">
        <h1>Manage Feature Flags</h1>

        <FeatureFlagsTable />

        <Link href="/">
          <Button type="button" data-testid="apply-changes">
            Apply changes and return to the App
          </Button>
        </Link>

        <Link href="?_ff=reset">
          <Button type="button" data-testid="reset-defaults" secondary>
            Reset all flags to defaults
          </Button>
        </Link>
      </div>
    </>
  );
}

export default withFeatureFlag<FeatureFlagsProps, never>(
  FeatureFlags,
  "featureFlagAdminOff",
  () => notFound(),
);

"use client";

import { useFeatureFlags } from "src/hooks/useFeatureFlags";

import { Alert, GridContainer } from "@trussworks/react-uswds";

type Props = {
  message: string;
};

/**
 * Site-wide banner giving advance notice of a planned maintenance window.
 *
 * Renders nothing unless the `maintenanceBannerEnabled` feature flag is on and a
 * message is configured. The message is free text (set via
 * the MAINTENANCE_BANNER_MESSAGE env var) and passed in from the server layout.
 */
export default function MaintenanceBanner({ message }: Props) {
  const { checkFeatureFlag } = useFeatureFlags();

  if (!checkFeatureFlag("maintenanceBannerEnabled") || !message) {
    return null;
  }

  return (
    <GridContainer className="padding-y-1">
      <Alert
        type="info"
        headingLevel="h2"
        slim={true}
        data-testid="maintenance-banner"
      >
        {message}
      </Alert>
    </GridContainer>
  );
}

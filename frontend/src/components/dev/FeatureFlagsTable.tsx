"use client";

import { useFeatureFlags } from "src/hooks/useFeatureFlags";

import React, { useState } from "react";
import { Button, Table } from "@trussworks/react-uswds";

import BetaAlert from "src/components/BetaAlert";

/**
 * View for managing feature flags
 */
export default function FeatureFlagsTable() {
  const { setFeatureFlag, featureFlags, defaultFeatureFlags } =
    useFeatureFlags();
  const [pendingChanges, setPendingChanges] = useState(false);

  const handleFeatureChange = (flagName: string, value: boolean) => {
    setPendingChanges(true);
    setFeatureFlag(flagName, value);
  };

  return (
    <>
      {pendingChanges && (
        <BetaAlert
          heading="Refresh your page"
          alertMessage="Hard refresh your page when done changing Flags for the changes to fully apply."
        />
      )}
      <Table>
        <thead>
          <tr>
            <th scope="col">Default</th>
            <th scope="col">Your Setting</th>
            <th scope="col">Feature Flag</th>
            <th scope="col">Actions</th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(featureFlags).map(([featureName, enabled]) => (
            <tr key={featureName}>
              <td
                data-testid={`${featureName}-default`}
                style={{
                  background: defaultFeatureFlags?.[featureName]
                    ? "#81cc81"
                    : "#fc6a6a",
                }}
              >
                {defaultFeatureFlags?.[featureName] ? "Enabled" : "Disabled"}
              </td>
              <td
                data-testid={`${featureName}-status`}
                style={{ background: enabled ? "#81cc81" : "#fc6a6a" }}
              >
                {enabled ? "Enabled" : "Disabled"}
              </td>
              <th scope="row">{featureName}</th>
              <td>
                <Button
                  data-testid={`enable-${featureName}`}
                  disabled={!!enabled}
                  onClick={() => handleFeatureChange(featureName, true)}
                  type="button"
                >
                  Enable
                </Button>
                <Button
                  data-testid={`disable-${featureName}`}
                  disabled={!enabled}
                  onClick={() => handleFeatureChange(featureName, false)}
                  type="button"
                >
                  Disable
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
    </>
  );
}

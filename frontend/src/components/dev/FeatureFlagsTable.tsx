"use client";

import { useFeatureFlags } from "src/hooks/useFeatureFlags";
import { useSearchParamUpdater } from "src/hooks/useSearchParamUpdater";

import React from "react";
import { Button, Table } from "@trussworks/react-uswds";

/**
 * View for managing feature flags
 */
export default function FeatureFlagsTable() {
  const { setFeatureFlag, featureFlags } = useFeatureFlags();
  const { setQueryParam } = useSearchParamUpdater();

  return (
    <>
      <Table>
        <thead>
          <tr>
            <th scope="col">Status</th>
            <th scope="col">Feature Flag</th>
            <th scope="col">Actions</th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(featureFlags).map(([featureName, enabled]) => (
            <tr key={featureName}>
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
                  onClick={() => {
                    setFeatureFlag(featureName, true);
                    setQueryParam("_ff", "");
                  }}
                  type="button"
                >
                  Enable
                </Button>
                <Button
                  data-testid={`disable-${featureName}`}
                  disabled={!enabled}
                  onClick={() => {
                    setFeatureFlag(featureName, false);
                    setQueryParam("_ff", "");
                  }}
                  type="button"
                >
                  Disable
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
      <Button
        data-testid={"reset-defaults"}
        onClick={() => {
          setQueryParam("_ff", "reset");
        }}
        type="button"
      >
        Reset to Defaults
      </Button>
    </>
  );
}

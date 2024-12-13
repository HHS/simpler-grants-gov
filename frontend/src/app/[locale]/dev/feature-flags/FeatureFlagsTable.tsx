"use client";

import { useFeatureFlags } from "src/hooks/useFeatureFlags";
import { useUser } from "src/services/auth/useUser";

import React from "react";
import { Button, Table } from "@trussworks/react-uswds";

/**
 * View for managing feature flags
 */
export default function FeatureFlagsTable() {
  const { featureFlagsManager, mounted, setFeatureFlag } = useFeatureFlags();
  const { user, isLoading, error } = useUser();

  console.log("~~~ user ~~~", user);
  console.log("~~~ error ~~~", error);
  console.log("~~~ isLoading ~~~", isLoading);

  if (!mounted) {
    return null;
  }

  return (
    <>
      <h2>User with token {user?.token} can see this</h2>
      <Table>
        <thead>
          <tr>
            <th scope="col">Status</th>
            <th scope="col">Feature Flag</th>
            <th scope="col">Actions</th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(featureFlagsManager.featureFlags).map(
            ([featureName, enabled]) => (
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
                    disabled={enabled}
                    onClick={() => setFeatureFlag(featureName, true)}
                    type="button"
                  >
                    Enable
                  </Button>
                  <Button
                    data-testid={`disable-${featureName}`}
                    disabled={!enabled}
                    onClick={() => setFeatureFlag(featureName, false)}
                    type="button"
                  >
                    Disable
                  </Button>
                </td>
              </tr>
            ),
          )}
        </tbody>
      </Table>
    </>
  );
}

"use client";

import { ReactElement, useState } from "react";
import { Alert, GridContainer } from "@trussworks/react-uswds";

import { NotificationPreferenceCard } from "./NotificationPreferenceCard";
import {
  NotificationOrganization,
  NotificationPreferenceKey,
} from "./NotificationTypes";
import { OrganizationPreferenceSection } from "./OrganizationPreferenceSection";

interface NotificationsPageContentProps {
  pageHeading: string;
  fetchErrorMessage: string;
  managePreferencesTitle: string;
  managePreferencesDescription: string;
  organizationPreferencesTitle: string;
  organizationPreferencesDescription: string;
  savedOpportunitiesLabel: string;
  savedOpportunitiesDescription: string;
  organizationSavedOpportunitiesDescription: string;
  organizations: NotificationOrganization[];
  hasOrganizationsFetchError: boolean;
}

export function NotificationsPageContent({
  pageHeading,
  fetchErrorMessage,
  managePreferencesTitle,
  managePreferencesDescription,
  organizationPreferencesTitle,
  organizationPreferencesDescription,
  savedOpportunitiesLabel,
  savedOpportunitiesDescription,
  organizationSavedOpportunitiesDescription,
  organizations,
  hasOrganizationsFetchError,
}: NotificationsPageContentProps): ReactElement {
  const [pageLevelErrorMessage, setPageLevelErrorMessage] = useState<
    string | null
  >(null);
  const [savingPreferenceKey, setSavingPreferenceKey] =
    useState<NotificationPreferenceKey | null>(null);
  const [errorPreferenceKey, setErrorPreferenceKey] =
    useState<NotificationPreferenceKey | null>(null);

  const [organizationPreferenceValues, setOrganizationPreferenceValues] =
    useState<Record<string, boolean>>(() =>
      Object.fromEntries(
        organizations.map((organization) => [
          `organization-${organization.organizationId}-saved-opportunities`,
          false,
        ]),
      ),
    );

  async function handlePreferenceToggle(
    preferenceKey: NotificationPreferenceKey,
  ): Promise<void> {
    setPageLevelErrorMessage(null);
    setErrorPreferenceKey(null);
    setSavingPreferenceKey(preferenceKey);

    await new Promise((resolve) => {
      window.setTimeout(resolve, 1200);
    });

    setSavingPreferenceKey(null);
    setErrorPreferenceKey(preferenceKey);
    setPageLevelErrorMessage(
      "Your notification preference was not saved. Refresh the page to try again.",
    );
  }

  function handleOrganizationPreferenceToggle(
    preferenceKey: NotificationPreferenceKey,
  ): void {
    setPageLevelErrorMessage(null);
    setErrorPreferenceKey(null);

    setOrganizationPreferenceValues((previousValues) => ({
      ...previousValues,
      [preferenceKey]: !previousValues[preferenceKey],
    }));
  }

  const pageErrorMessage =
    pageLevelErrorMessage ??
    (hasOrganizationsFetchError ? fetchErrorMessage : null);

  const isSavingSavedOpportunities =
    savingPreferenceKey === "saved-opportunities";
  const hasSavedOpportunitiesError =
    errorPreferenceKey === "saved-opportunities";

  return (
    <GridContainer className="padding-top-2 tablet:padding-y-6">
      <h1>{pageHeading}</h1>

      <div className="margin-y-2" aria-live="polite">
        {pageErrorMessage ? (
          <div className="notifications-page-error-enter">
            <Alert slim={true} headingLevel="h6" noIcon={true} type="error">
              {pageErrorMessage}
            </Alert>
          </div>
        ) : null}
      </div>

      <section
        aria-labelledby="manage-your-preferences"
        className="margin-bottom-6"
      >
        <h2
          id="manage-your-preferences"
          className="margin-bottom-1 margin-top-4"
        >
          {managePreferencesTitle}
        </h2>
        <p className="margin-top-0 margin-bottom-3">
          {managePreferencesDescription}
        </p>

        <NotificationPreferenceCard
          checkboxId="saved-opportunities"
          label={savedOpportunitiesLabel}
          description={savedOpportunitiesDescription}
          isChecked={true}
          isDisabled={isSavingSavedOpportunities}
          isLoading={isSavingSavedOpportunities}
          hasError={hasSavedOpportunitiesError}
          onCheckedChange={() => {
            void handlePreferenceToggle("saved-opportunities");
          }}
        />
      </section>

      {organizations.length > 0 ? (
        <section aria-labelledby="organization-preferences">
          <h2 id="organization-preferences" className="margin-bottom-1">
            {organizationPreferencesTitle}
          </h2>
          <p className="margin-top-0 margin-bottom-3">
            {organizationPreferencesDescription}
          </p>

          <div className="display-grid gap-4">
            {organizations.map((organization) => {
              const preferenceKey = `organization-${organization.organizationId}-saved-opportunities`;
              const isSavingThisPreference =
                savingPreferenceKey === preferenceKey;
              const hasErrorThisPreference =
                errorPreferenceKey === preferenceKey;

              return (
                <OrganizationPreferenceSection
                  key={organization.organizationId}
                  organization={organization}
                  label={savedOpportunitiesLabel}
                  description={organizationSavedOpportunitiesDescription}
                  isChecked={
                    organizationPreferenceValues[preferenceKey] ?? false
                  }
                  isDisabled={isSavingThisPreference}
                  isLoading={isSavingThisPreference}
                  hasError={hasErrorThisPreference}
                  onCheckedChange={() => {
                    handleOrganizationPreferenceToggle(preferenceKey);
                  }}
                />
              );
            })}
          </div>
        </section>
      ) : null}
    </GridContainer>
  );
}

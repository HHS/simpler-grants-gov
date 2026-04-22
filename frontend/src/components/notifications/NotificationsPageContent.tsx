"use client";

import { ReactElement, startTransition, useState } from "react";
import { Alert, GridContainer } from "@trussworks/react-uswds";

import { updateSavedOpportunityNotificationPreferenceAction } from "./actions";
import { NotificationPreferenceCard } from "./NotificationPreferenceCard";
import {
  NotificationOrganization,
  NotificationPreferenceKey,
  NotificationPreferenceValues,
} from "./NotificationTypes";
import { OrganizationPreferenceSection } from "./OrganizationPreferenceSection";

export interface NotificationsPageContentProps {
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
  initialPreferenceValues: NotificationPreferenceValues;
}

const SAVE_ERROR_MESSAGE =
  "Your notification preference was not saved. Refresh the page to try again.";

function buildPersonalPreferenceKey(): NotificationPreferenceKey {
  return "saved-opportunities";
}

function buildOrganizationPreferenceKey(
  organizationId: string,
): NotificationPreferenceKey {
  return `organization-${organizationId}-saved-opportunities`;
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
  initialPreferenceValues,
}: NotificationsPageContentProps): ReactElement {
  /**
   * Current checkbox state for personal + organization preferences.
   * Values are hydrated from the server on initial render and updated
   * only after successful API responses.
   */
  const [preferenceValues, setPreferenceValues] =
    useState<NotificationPreferenceValues>(initialPreferenceValues);

  /**
   * Tracks the row currently saving so we can disable it and show inline loading.
   */
  const [savingPreferenceKey, setSavingPreferenceKey] =
    useState<NotificationPreferenceKey | null>(null);

  /**
   * Tracks the row that most recently failed to save so we can render
   * row-level error styling and inline messaging.
   */
  const [errorPreferenceKey, setErrorPreferenceKey] =
    useState<NotificationPreferenceKey | null>(null);

  /**
   * Top-level error banner message for failed save requests.
   * Organization fetch failures still come from props and take lower priority.
   */
  const [pageLevelErrorMessage, setPageLevelErrorMessage] = useState<
    string | null
  >(null);

  function handlePreferenceToggle(
    preferenceKey: NotificationPreferenceKey,
    organizationId: string | null,
  ): void {
    const currentValue = preferenceValues[preferenceKey] ?? false;
    const nextValue = !currentValue;

    setPageLevelErrorMessage(null);
    setErrorPreferenceKey(null);
    setSavingPreferenceKey(preferenceKey);

    startTransition(async () => {
      const actionResult =
        await updateSavedOpportunityNotificationPreferenceAction({
          organizationId,
          emailEnabled: nextValue,
        });

      setSavingPreferenceKey(null);

      if (!actionResult?.success) {
        setErrorPreferenceKey(preferenceKey);
        setPageLevelErrorMessage(actionResult?.error ?? SAVE_ERROR_MESSAGE);
        return;
      }

      setPreferenceValues((previousValues) => ({
        ...previousValues,
        [preferenceKey]: nextValue,
      }));
    });
  }

  /**
   * Save failures take precedence over the initial fetch error so the user
   * gets the most recent and relevant feedback.
   */
  const pageErrorMessage =
    pageLevelErrorMessage ??
    (hasOrganizationsFetchError ? fetchErrorMessage : null);

  const personalPreferenceKey = buildPersonalPreferenceKey();
  const isSavingSavedOpportunities =
    savingPreferenceKey === personalPreferenceKey;
  const hasSavedOpportunitiesError =
    errorPreferenceKey === personalPreferenceKey;
  const isSavedOpportunitiesChecked =
    preferenceValues[personalPreferenceKey] ?? false;

  return (
    <GridContainer className="padding-top-2 tablet:padding-y-6">
      <h1>{pageHeading}</h1>

      <div className="margin-y-2" aria-live="polite">
        {pageErrorMessage && (
          <div
            className="margin-y-2 notifications-page-error-enter"
            role="alert"
            aria-atomic="true"
          >
            <Alert slim={true} headingLevel="h6" noIcon={true} type="error">
              {pageErrorMessage}
            </Alert>
          </div>
        )}
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
          checkboxId={personalPreferenceKey}
          label={savedOpportunitiesLabel}
          description={savedOpportunitiesDescription}
          isChecked={isSavedOpportunitiesChecked}
          isDisabled={isSavingSavedOpportunities}
          isLoading={isSavingSavedOpportunities}
          hasError={hasSavedOpportunitiesError}
          errorMessage={
            hasSavedOpportunitiesError ? SAVE_ERROR_MESSAGE : undefined
          }
          onCheckedChange={() => {
            handlePreferenceToggle(personalPreferenceKey, null);
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
              const preferenceKey = buildOrganizationPreferenceKey(
                organization.organizationId,
              );
              const isSavingThisPreference =
                savingPreferenceKey === preferenceKey;
              const hasErrorThisPreference =
                errorPreferenceKey === preferenceKey;
              const isChecked = preferenceValues[preferenceKey] ?? false;

              return (
                <OrganizationPreferenceSection
                  key={organization.organizationId}
                  organization={organization}
                  label={savedOpportunitiesLabel}
                  description={organizationSavedOpportunitiesDescription}
                  isChecked={isChecked}
                  isDisabled={isSavingThisPreference}
                  isLoading={isSavingThisPreference}
                  hasError={hasErrorThisPreference}
                  errorMessage={
                    hasErrorThisPreference ? SAVE_ERROR_MESSAGE : undefined
                  }
                  onCheckedChange={() => {
                    handlePreferenceToggle(
                      preferenceKey,
                      organization.organizationId,
                    );
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

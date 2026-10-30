"use client";

import {
  updateAllOpportunitiesNotificationPreferenceAction,
  UpdateNotificationPreferenceActionState,
  updateSavedOpportunityNotificationPreferenceAction,
} from "src/app/[locale]/(base)/notifications/actions";
import {
  NotificationOrganization,
  NotificationPreferenceKey,
  NotificationPreferenceValues,
} from "src/types/NotificationTypes";

import { ReactElement, startTransition, useState } from "react";
import { Alert, GridContainer } from "@trussworks/react-uswds";

import { NotificationPreferenceCard } from "./NotificationPreferenceCard";
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
  allNewOpportunitiesLabel: string;
  allNewOpportunitiesDescription: string;
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

const ALL_NEW_OPPORTUNITIES_PREFERENCE_KEY: NotificationPreferenceKey =
  "all-new-opportunities";

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
  allNewOpportunitiesLabel,
  allNewOpportunitiesDescription,
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

  /**
   * When turnOffOnError is set, a failed save forces the preference to OFF
   * instead of leaving it at its previous value.
   */
  function handlePreferenceToggle(
    preferenceKey: NotificationPreferenceKey,
    savePreference: (
      nextValue: boolean,
    ) => Promise<UpdateNotificationPreferenceActionState>,
    { turnOffOnError = false }: { turnOffOnError?: boolean } = {},
  ): void {
    const currentValue = preferenceValues[preferenceKey] ?? false;
    const nextValue = !currentValue;

    setPageLevelErrorMessage(null);
    setErrorPreferenceKey(null);
    setSavingPreferenceKey(preferenceKey);

    startTransition(async () => {
      const actionResult = await savePreference(nextValue);

      setSavingPreferenceKey(null);

      if (!actionResult?.success) {
        setErrorPreferenceKey(preferenceKey);
        setPageLevelErrorMessage(actionResult?.error ?? SAVE_ERROR_MESSAGE);

        if (turnOffOnError) {
          setPreferenceValues((previousValues) => ({
            ...previousValues,
            [preferenceKey]: false,
          }));
        }
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

  const isSavingAllNewOpportunities =
    savingPreferenceKey === ALL_NEW_OPPORTUNITIES_PREFERENCE_KEY;
  const hasAllNewOpportunitiesError =
    errorPreferenceKey === ALL_NEW_OPPORTUNITIES_PREFERENCE_KEY;
  const isAllNewOpportunitiesChecked =
    preferenceValues[ALL_NEW_OPPORTUNITIES_PREFERENCE_KEY] ?? false;

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
          className="margin-bottom-1"
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
            handlePreferenceToggle(personalPreferenceKey, (emailEnabled) =>
              updateSavedOpportunityNotificationPreferenceAction({
                organizationId: null,
                emailEnabled,
              }),
            );
          }}
        />

        <NotificationPreferenceCard
          checkboxId={ALL_NEW_OPPORTUNITIES_PREFERENCE_KEY}
          label={allNewOpportunitiesLabel}
          description={allNewOpportunitiesDescription}
          isChecked={isAllNewOpportunitiesChecked}
          isDisabled={isSavingAllNewOpportunities}
          isLoading={isSavingAllNewOpportunities}
          hasError={hasAllNewOpportunitiesError}
          errorMessage={
            hasAllNewOpportunitiesError ? SAVE_ERROR_MESSAGE : undefined
          }
          onCheckedChange={() => {
            handlePreferenceToggle(
              ALL_NEW_OPPORTUNITIES_PREFERENCE_KEY,
              (isEnabled) =>
                updateAllOpportunitiesNotificationPreferenceAction({
                  isEnabled,
                }),
              { turnOffOnError: true },
            );
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
                    handlePreferenceToggle(preferenceKey, (emailEnabled) =>
                      updateSavedOpportunityNotificationPreferenceAction({
                        organizationId: organization.organizationId,
                        emailEnabled,
                      }),
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

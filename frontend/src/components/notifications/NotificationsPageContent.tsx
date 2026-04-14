"use client";

import { ReactElement, useState } from "react";
import { Alert, GridContainer } from "@trussworks/react-uswds";

import { NotificationPreferenceCard } from "./NotificationPreferenceCard";
import {
  NotificationOrganization,
  NotificationPreferenceKey,
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
}

/**
 * Centralized error message for failed preference updates.
 * This should eventually come from translations when backend wiring is complete.
 */
const SAVE_ERROR_MESSAGE =
  "Your notification preference was not saved. Refresh the page to try again.";

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
  /**
   * Page-level error state.
   * Used for:
   * - organization fetch failures
   * - preference save failures (fallback/global message)
   */
  const [pageLevelErrorMessage, setPageLevelErrorMessage] = useState<
    string | null
  >(null);

  /**
   * Tracks which preference is currently being saved.
   * Used to:
   * - disable the corresponding control
   * - show inline loading state
   */
  const [savingPreferenceKey, setSavingPreferenceKey] =
    useState<NotificationPreferenceKey | null>(null);

  /**
   * Tracks which preference failed to save.
   * Used to:
   * - render inline error message
   * - apply error styling to the row
   */
  const [errorPreferenceKey, setErrorPreferenceKey] =
    useState<NotificationPreferenceKey | null>(null);

  /**
   * Local UI state for organization preferences.
   * These are currently client-only toggles (no API call yet).
   */
  const [organizationPreferenceValues, setOrganizationPreferenceValues] =
    useState<Record<string, boolean>>(() =>
      Object.fromEntries(
        organizations.map((organization) => [
          `organization-${organization.organizationId}-saved-opportunities`,
          false,
        ]),
      ),
    );

  /**
   * Handles toggle for primary (non-organization) preferences.
   *
   * CURRENT BEHAVIOR (placeholder for future API integration):
   * - simulates async save
   * - always results in failure to demonstrate error states
   *
   * FUTURE:
   * - replace with API call
   * - set success/error based on response
   */
  async function handlePreferenceToggle(
    preferenceKey: NotificationPreferenceKey,
  ): Promise<void> {
    setPageLevelErrorMessage(null);
    setErrorPreferenceKey(null);
    setSavingPreferenceKey(preferenceKey);

    // Simulated network delay
    await new Promise((resolve) => {
      window.setTimeout(resolve, 1200);
    });

    // Simulated failure state
    setSavingPreferenceKey(null);
    setErrorPreferenceKey(preferenceKey);
    setPageLevelErrorMessage(SAVE_ERROR_MESSAGE);
  }

  /**
   * Handles toggle for organization preferences.
   *
   * CURRENT BEHAVIOR:
   * - updates local UI state only
   * - does not simulate loading or error
   *
   * FUTURE:
   * - mirror behavior of handlePreferenceToggle
   * - integrate API + loading + error handling
   */
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

  /**
   * Determines which error message to show at the page level.
   * Priority:
   * 1. preference save error
   * 2. organization fetch error
   */
  const pageErrorMessage =
    pageLevelErrorMessage ??
    (hasOrganizationsFetchError ? fetchErrorMessage : null);

  /**
   * Derived state for primary "Saved Opportunities" preference
   */
  const isSavingSavedOpportunities =
    savingPreferenceKey === "saved-opportunities";

  const hasSavedOpportunitiesError =
    errorPreferenceKey === "saved-opportunities";

  return (
    <GridContainer className="padding-top-2 tablet:padding-y-6">
      <h1>{pageHeading}</h1>

      {/* 
        Page-level error region
        - uses aria-live so screen readers announce updates
        - animated for visual emphasis
      */}
      <div className="margin-y-2" aria-live="polite">
        {pageErrorMessage ? (
          <div className="notifications-page-error-enter">
            <Alert slim={true} headingLevel="h6" noIcon={true} type="error">
              {pageErrorMessage}
            </Alert>
          </div>
        ) : null}
      </div>

      {/* =====================
          USER PREFERENCES
      ===================== */}
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

        {/*
          Primary preference row

          NOTE:
          - currently simulates loading + failure
          - used to validate UX patterns (loading, error, retry)
        */}
        <NotificationPreferenceCard
          checkboxId="saved-opportunities"
          label={savedOpportunitiesLabel}
          description={savedOpportunitiesDescription}
          isChecked={true}
          isDisabled={isSavingSavedOpportunities}
          isLoading={isSavingSavedOpportunities}
          hasError={hasSavedOpportunitiesError}
          errorMessage={
            hasSavedOpportunitiesError ? SAVE_ERROR_MESSAGE : undefined
          }
          onCheckedChange={() => {
            handlePreferenceToggle("saved-opportunities").catch(() => {
              // no-op: placeholder async error path is handled inside the component state
            });
          }}
        />
      </section>

      {/* =====================
          ORGANIZATION PREFERENCES
      ===================== */}
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
                  errorMessage={
                    hasErrorThisPreference ? SAVE_ERROR_MESSAGE : undefined
                  }
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

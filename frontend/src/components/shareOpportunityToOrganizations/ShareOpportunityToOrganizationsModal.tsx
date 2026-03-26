"use client";

import { Organization } from "src/types/applicationResponseTypes";
import { BaseOpportunity } from "src/types/opportunity/opportunityResponseTypes";

import { useTranslations } from "next-intl";
import { RefObject, startTransition, useEffect, useState } from "react";
import {
  Alert,
  Checkbox,
  Fieldset,
  ModalFooter,
  ModalRef,
  ModalToggleButton,
} from "@trussworks/react-uswds";

import {
  deleteSavedOpportunityForOrganizationAction,
  saveOpportunityForOrganizationAction,
} from "src/components/shareOpportunityToOrganizations/actions";
import { SimplerModal } from "src/components/SimplerModal";

const MODAL_ID = "share-opportunity-to-organizations";

export interface ShareOpportunityToOrganizationsModalProps {
  modalRef: RefObject<ModalRef | null>;
  organizations: Organization[];
  savedToOrganizationIds: Set<string>;
  isLoadingOrganizations: boolean;
  hasOrganizationsError: boolean;
  selectedOpportunity?: BaseOpportunity | null;
  onSavedOrganizationsChange: (organizationIds: Set<string>) => void;
}

export function ShareOpportunityToOrganizationsModal({
  modalRef,
  organizations,
  savedToOrganizationIds,
  isLoadingOrganizations,
  hasOrganizationsError,
  selectedOpportunity,
  onSavedOrganizationsChange,
}: ShareOpportunityToOrganizationsModalProps) {
  const t = useTranslations("ShareOpportunityToOrganization");
  const opportunityId = selectedOpportunity?.opportunity_id;
  const opportunityTitle = selectedOpportunity?.opportunity_title;

  const [pendingOrganizationIds, setPendingOrganizationIds] = useState<
    Set<string>
  >(() => new Set());

  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    setPendingOrganizationIds(new Set());
    setActionError(null);
  }, [opportunityId]);

  const updatePendingOrganizationState = (
    organizationId: string,
    isPending: boolean,
  ) => {
    setPendingOrganizationIds((previousPendingOrganizationIds) => {
      const nextPendingOrganizationIds = new Set(
        previousPendingOrganizationIds,
      );

      if (isPending) {
        nextPendingOrganizationIds.add(organizationId);
      } else {
        nextPendingOrganizationIds.delete(organizationId);
      }

      return nextPendingOrganizationIds;
    });
  };

  const handleOrganizationCheckboxChange = (
    organizationId: string,
    isCurrentlyChecked: boolean,
  ) => {
    if (!opportunityId) {
      setActionError(t("modal.error"));
      return;
    }

    setActionError(null);
    updatePendingOrganizationState(organizationId, true);

    startTransition(async () => {
      const actionResult = isCurrentlyChecked
        ? await deleteSavedOpportunityForOrganizationAction({
            organizationId,
            opportunityId,
          })
        : await saveOpportunityForOrganizationAction({
            organizationId,
            opportunityId,
          });

      updatePendingOrganizationState(organizationId, false);

      if (!actionResult?.success) {
        setActionError(actionResult?.error ?? t("modal.error"));
        return;
      }

      const nextSavedOrganizationIds = new Set(savedToOrganizationIds);

      if (isCurrentlyChecked) {
        nextSavedOrganizationIds.delete(organizationId);
      } else {
        nextSavedOrganizationIds.add(organizationId);
      }

      onSavedOrganizationsChange(nextSavedOrganizationIds);
    });
  };

  const modalContent = () => {
    if (hasOrganizationsError) {
      return (
        <Alert type="error" headingLevel="h4" slim noIcon>
          {t("modal.error")}
        </Alert>
      );
    }

    if (isLoadingOrganizations) {
      return <p>{t("modal.loadingOrganizations")}</p>;
    }

    if (organizations.length === 0) {
      return <p>{t("modal.fallbackError")}</p>;
    }

    return (
      <>
        {actionError ? (
          <Alert type="error" headingLevel="h4" slim noIcon>
            {actionError}
          </Alert>
        ) : null}

        <Fieldset
          legend="Which organization should see this?"
          className="display-block"
        >
          <ul className="padding-0 margin-0">
            {organizations.map((organization) => {
              const organizationId = organization.organization_id;
              const isChecked = savedToOrganizationIds.has(organizationId);
              const isDisabled = pendingOrganizationIds.has(organizationId);

              return (
                <li
                  key={organizationId}
                  className={[
                    "display-block",
                    "border",
                    "border-base-light",
                    "padding-1",
                    "radius-md",
                    "share-opportunity-checkboxes",
                    isDisabled ? "share-opportunity-item--disabled" : "",
                  ].join(" ")}
                >
                  <Checkbox
                    id={`org-checkbox-${organizationId}`}
                    name={`org-checkbox-${organizationId}`}
                    label={organization.sam_gov_entity.legal_business_name}
                    checked={isChecked}
                    disabled={isDisabled}
                    onChange={() =>
                      handleOrganizationCheckboxChange(
                        organizationId,
                        isChecked,
                      )
                    }
                  />
                </li>
              );
            })}
          </ul>
        </Fieldset>
      </>
    );
  };

  return (
    <SimplerModal
      modalRef={modalRef}
      modalId={MODAL_ID}
      className="text-wrap maxw-tablet-lg share-opportunity-modal"
      titleText="Share this opportunity with an organization"
    >
      <p id={`${MODAL_ID}-description`} className="usa-sr-only">
        {t("modal.description")}
      </p>

      {opportunityTitle ? (
        <>
          <p className="margin-top-1">
            <strong>
              {t("modal.opportunity")} {opportunityTitle}
            </strong>
          </p>
          <hr />
        </>
      ) : null}

      {modalContent()}

      <ModalFooter>
        <ModalToggleButton
          modalRef={modalRef}
          closer
          unstyled
          className="padding-105 text-center"
        >
          {t("modal.close")}
        </ModalToggleButton>
      </ModalFooter>
    </SimplerModal>
  );
}

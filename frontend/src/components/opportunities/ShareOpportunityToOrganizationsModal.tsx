"use client";

import { Organization } from "src/types/applicationResponseTypes";

import { useTranslations } from "next-intl";
import { RefObject } from "react";
import {
  Alert,
  Checkbox,
  Fieldset,
  ModalFooter,
  ModalRef,
  ModalToggleButton,
} from "@trussworks/react-uswds";

import { SimplerModal } from "src/components/SimplerModal";

const MODAL_ID = "share-opportunity-to-organizations";

export interface ShareOpportunityToOrganizationsModalProps {
  modalRef: RefObject<ModalRef | null>;
  organizations: Organization[];
  savedToOrganizationIds: Set<string>;
  isLoadingOrganizations: boolean;
  hasOrganizationsError: boolean;
  opportunityTitle?: string | null;
}

export function ShareOpportunityToOrganizationsModal({
  modalRef,
  organizations,
  savedToOrganizationIds,
  isLoadingOrganizations,
  hasOrganizationsError,
  opportunityTitle,
}: ShareOpportunityToOrganizationsModalProps) {
  const t = useTranslations("ShareOpportunityToOrganization");
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
      <Fieldset
        legend="Which organization should see this?"
        className="display-block"
      >
        <ul className="padding-0 margin-0">
          {organizations.map((organization) => {
            const isDisabled = true;

            return (
              <li
                key={organization.organization_id}
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
                  id={`org-checkbox-${organization.organization_id}`}
                  name={`org-checkbox-${organization.organization_id}`}
                  label={organization.sam_gov_entity.legal_business_name}
                  checked={savedToOrganizationIds.has(
                    organization.organization_id,
                  )}
                  disabled={isDisabled}
                  onChange={() => undefined}
                />
              </li>
            );
          })}
        </ul>
      </Fieldset>
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

import { ApplicantTypes } from "src/types/competitionsResponseTypes";
import { Organization } from "src/types/UserTypes";

import { useTranslations } from "next-intl";
import { RefObject } from "react";
import {
  Button,
  ErrorMessage,
  FormGroup,
  Label,
  ModalFooter,
  ModalRef,
  ModalToggleButton,
  Select,
  TextInput,
} from "@trussworks/react-uswds";

export const CreateApplicationOrganizationInput = ({
  error = "",
  onOrganizationChange,
  validationError = "",
  organizations,
  selectedOrganization,
}: {
  onOrganizationChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  organizations: Organization[];
  selectedOrganization?: string; // organization_id
  error?: string;
  validationError?: string;
}) => {
  const t = useTranslations(
    "OpportunityListing.startApplicationModal.fields.organizationSelect",
  );
  return (
    <>
      <Label
        id={"label-for-organization"}
        key={"label-for-organization"}
        htmlFor="application-organization"
        className="font-sans-2xs"
      >
        {t("label")}
      </Label>
      {validationError && <ErrorMessage>{validationError}</ErrorMessage>}
      {error && <ErrorMessage>{error}</ErrorMessage>}

      <Select
        id="create-application-organization-select"
        name="application-orgnization"
        onChange={onOrganizationChange}
        value={selectedOrganization || 0}
      >
        <option key={1} value={0} disabled>
          {t("default")}
        </option>
        {organizations.length &&
          organizations.map((organization) => (
            <option
              key={organization.organization_id}
              value={organization.organization_id}
            >
              {organization.sam_gov_entity.legal_business_name}
            </option>
          ))}
      </Select>
    </>
  );
};

export const CreateApplicationNameInput = ({
  error = "",
  onNameChange,
  validationError = "",
}: {
  error?: string;
  onNameChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  validationError?: string;
}) => {
  const t = useTranslations(
    "OpportunityListing.startApplicationModal.fields.name",
  );
  return (
    <>
      <Label
        id={"label-for-name"}
        key={"label-for-name"}
        htmlFor="application-name"
        className="font-sans-2xs"
      >
        {t("label")}
        <div>{t("description")}</div>
      </Label>
      {validationError && <ErrorMessage>{validationError}</ErrorMessage>}
      {error && <ErrorMessage>{error}</ErrorMessage>}

      <TextInput
        type="text"
        name="application-name"
        id="application-name"
        onChange={onNameChange}
      />
    </>
  );
};

export const CompetitionStartForm = ({
  opportunityTitle,
  error = "",
  loading = false,
  modalRef,
  onNameChange,
  onOrganizationChange,
  onClose,
  onSubmit,
  validationError = "",
  selectedOrganization,
  applicantTypes,
  organizations,
}: {
  opportunityTitle: string;
  loading?: boolean;
  error?: string;
  modalRef: RefObject<ModalRef | null>;
  onNameChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onOrganizationChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  onClose: () => void;
  onSubmit: () => void;
  validationError?: string;
  selectedOrganization?: string;
  applicantTypes: ApplicantTypes[];
  organizations: Organization[];
}) => {
  const t = useTranslations("OpportunityListing");

  return (
    <div className="display-flex flex-align-start">
      <FormGroup error={!!validationError} className="margin-top-1">
        <p className="font-sans-sm" data-testid="opportunity-title">
          {opportunityTitle}
        </p>
        <p className="font-sans-3xs">
          {t("startApplicationModal.requiredText")}
        </p>
        <CreateApplicationNameInput
          error={error}
          validationError={validationError}
          onNameChange={onNameChange}
        />
        {applicantTypes.includes("organization") && (
          <CreateApplicationOrganizationInput
            error={error}
            onOrganizationChange={onOrganizationChange}
            validationError={validationError}
            organizations={organizations}
            selectedOrganization={selectedOrganization}
          />
        )}
        <ModalFooter>
          <Button
            onClick={onSubmit}
            type="button"
            data-testid="competition-start-individual-save"
            disabled={!!loading}
          >
            {loading ? "loading..." : t("startApplicationModal.saveButtonText")}
          </Button>
          <ModalToggleButton
            modalRef={modalRef}
            closer
            unstyled
            className="padding-105 text-center"
            onClick={onClose}
          >
            {t("startApplicationModal.cancelButtonText")}
          </ModalToggleButton>
        </ModalFooter>
      </FormGroup>
    </div>
  );
};

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

const ApplicationStartDescription = ({
  organizations,
  applicantTypes,
}: {
  organizations: Organization[];
  applicantTypes: ApplicantTypes[];
}) => {
  const t = useTranslations(
    "OpportunityListing.startApplicationModal.description",
  );
  // individual
  if (!applicantTypes.includes("organization")) {
    return;
  }
  // ineligible
  if (!organizations.length && !applicantTypes.includes("individual")) {
    return (
      <div>
        <span>{t("organizationIntro")}</span>
        <ul>
          <li>{t("applyingForOrg")}</li>
          <li>{t("poc")}</li>
          <li>
            {t.rich("uei", {
              link: (chunk) => (
                <a
                  target="_blank"
                  rel="noopener noreferrer"
                  href="https://sam.gov"
                >
                  {chunk}
                </a>
              ),
            })}
          </li>
        </ul>
        <div>
          {t.rich("ineligibleGoToGrants", {
            link: (chunk) => (
              <a
                target="_blank"
                rel="noopener noreferrer"
                href="https://grants.gov"
              >
                {chunk}
              </a>
            ),
          })}
        </div>
      </div>
    );
  }
  // individual or organization
  if (applicantTypes.length === 2) {
    return (
      <div>
        <div>
          {t.rich("pilotGoToGrants", {
            link: (chunk) => (
              <a
                target="_blank"
                rel="noopener noreferrer"
                href="https://grants.gov"
              >
                {chunk}
              </a>
            ),
          })}
        </div>
        <span>{t("organizationIndividualIntro")}</span>
        <ul>
          <li>{t("poc")}</li>
          <li>
            {t.rich("uei", {
              link: (chunk) => (
                <a
                  target="_blank"
                  rel="noopener noreferrer"
                  href="https://sam.gov"
                >
                  {chunk}
                </a>
              ),
            })}
          </li>
        </ul>
      </div>
    );
  }
  // organization
  return (
    <div>
      <span>{t("organizationIntro")}</span>
      <ul>
        <li>{t("poc")}</li>
        <li>{t("uei")}</li>
      </ul>
      <div>
        {t.rich("goToGrants", {
          link: (chunk) => (
            <a
              target="_blank"
              rel="noopener noreferrer"
              href="https://grants.gov"
            >
              {chunk}
            </a>
          ),
        })}
      </div>
    </div>
  );
};

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
  const t = useTranslations("OpportunityListing.startApplicationModal");

  return (
    <div>
      <ApplicationStartDescription
        organizations={organizations}
        applicantTypes={applicantTypes}
      />
      <p className="font-sans-sm text-bold" data-testid="opportunity-title">
        {t("applyingFor")} {opportunityTitle}
      </p>
      <p className="font-sans-3xs">{t("requiredText")}</p>
      <FormGroup error={!!validationError} className="margin-top-1">
        {applicantTypes.includes("organization") && (
          <CreateApplicationOrganizationInput
            error={error}
            onOrganizationChange={onOrganizationChange}
            validationError={validationError}
            organizations={organizations}
            selectedOrganization={selectedOrganization}
          />
        )}
        <CreateApplicationNameInput
          error={error}
          validationError={validationError}
          onNameChange={onNameChange}
        />
        <ModalFooter>
          <Button
            onClick={onSubmit}
            type="button"
            data-testid="competition-start-individual-save"
            disabled={!!loading}
          >
            {loading ? "Loading..." : t("saveButtonText")}
          </Button>
          <ModalToggleButton
            modalRef={modalRef}
            closer
            unstyled
            className="padding-105 text-center"
            onClick={onClose}
          >
            {t("cancelButtonText")}
          </ModalToggleButton>
        </ModalFooter>
      </FormGroup>
    </div>
  );
};

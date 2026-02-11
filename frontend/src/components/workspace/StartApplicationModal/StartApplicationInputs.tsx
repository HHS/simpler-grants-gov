import { UserOrganization } from "src/types/userTypes";

import { useTranslations } from "next-intl";
import {
  Alert,
  ErrorMessage,
  Label,
  Select,
  TextInput,
} from "@trussworks/react-uswds";

export const NOT_LISTED_ORG_VALUE = "not listed";

export const StartApplicationOrganizationInput = ({
  onOrganizationChange,
  validationError = "",
  organizations,
  selectedOrganization,
}: {
  onOrganizationChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  organizations: UserOrganization[];
  selectedOrganization?: string;
  validationError?: string;
}) => {
  const t = useTranslations("OpportunityListing.startApplicationModal");
  const isNotListedOrganizationSelected =
    selectedOrganization === NOT_LISTED_ORG_VALUE;
  const notListedOrgWarningBody = t.rich(
    "notListedOrgAlert.notListedOrgWarningBody",
    {
      link: (chunk) => (
        <a target="_blank" rel="noopener noreferrer" href="https://sam.gov">
          {chunk}
        </a>
      ),
    },
  );

  return (
    <>
      <Label
        id={"label-for-organization"}
        key={"label-for-organization"}
        htmlFor="application-organization"
        className="font-sans-2xs"
      >
        {t("fields.organizationSelect.label")}
      </Label>
      {validationError && <ErrorMessage>{validationError}</ErrorMessage>}

      <Select
        validationStatus={validationError ? "error" : undefined}
        id="create-application-organization-select"
        name="application-orgnization"
        onChange={onOrganizationChange}
        value={selectedOrganization || 0}
      >
        <option key={1} value={0} disabled>
          {t("fields.organizationSelect.default")}
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
        <option key="not-listed-org" value={NOT_LISTED_ORG_VALUE}>
          {t("fields.organizationSelect.notListed")}
        </option>
      </Select>
      {isNotListedOrganizationSelected ? (
        <Alert
          type="warning"
          noIcon
          headingLevel="h2"
          className="margin-top-2"
          heading={t("notListedOrgAlert.notListedOrgWarningTitle")}
        >
          {notListedOrgWarningBody}
        </Alert>
      ) : null}
    </>
  );
};

export const StartApplicationNameInput = ({
  onNameChange,
  validationError = "",
}: {
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

      <TextInput
        validationStatus={validationError ? "error" : undefined}
        type="text"
        name="application-name"
        id="application-name"
        onChange={onNameChange}
      />
    </>
  );
};

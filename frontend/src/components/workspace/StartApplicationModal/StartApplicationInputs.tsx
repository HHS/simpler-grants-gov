import { UserOrganization } from "src/types/userTypes";

import { useTranslations } from "next-intl";
import {
  ErrorMessage,
  Label,
  Select,
  TextInput,
} from "@trussworks/react-uswds";

export const StartApplicationOrganizationInput = ({
  onOrganizationChange,
  validationError = "",
  organizations,
  selectedOrganization,
}: {
  onOrganizationChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  organizations: UserOrganization[];
  selectedOrganization?: string; // organization_id
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

      <Select
        validationStatus={validationError ? "error" : undefined}
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

import { ApplicantTypes } from "src/types/competitionsResponseTypes";
import { UserOrganization } from "src/types/userTypes";

import { useTranslations } from "next-intl";
import {
  ErrorMessage,
  Label,
  Select,
  TextInput,
} from "@trussworks/react-uswds";

const SPECIAL_VALUES = {
  INDIVIDUAL: "INDIVIDUAL",
  NOT_LISTED: "NOT_LISTED",
} as const;

export const StartApplicationOrganizationInput = ({
  onOrganizationChange,
  validationError = "",
  organizations,
  selectedOrganization,
  applicantTypes,
}: {
  onOrganizationChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  organizations: UserOrganization[];
  selectedOrganization?: string; // organization_id
  validationError?: string;
  applicantTypes: ApplicantTypes[];
}) => {
  const t = useTranslations(
    "OpportunityListing.startApplicationModal.fields.organizationSelect",
  );

  // Sort organizations alphabetically by legal_business_name
  const sortedOrganizations = [...organizations].sort((a, b) =>
    a.sam_gov_entity.legal_business_name.localeCompare(
      b.sam_gov_entity.legal_business_name,
    ),
  );

  return (
    <>
      <Label
        id={"label-for-organization"}
        key={"label-for-organization"}
        htmlFor="application-organization"
        className="font-sans-sm text-bold"
      >
        {t("label")} <span className="text-red">*</span>
      </Label>
      {validationError && <ErrorMessage>{validationError}</ErrorMessage>}

      <Select
        validationStatus={validationError ? "error" : undefined}
        id="create-application-organization-select"
        name="application-orgnization"
        onChange={onOrganizationChange}
        value={selectedOrganization || 0}
      >
        {/* Default option */}
        <option key={1} value={0} disabled>
          {t("default")}
        </option>

        {/* Organizations alphabetically */}
        {sortedOrganizations.map((organization) => (
          <option
            key={organization.organization_id}
            value={organization.organization_id}
          >
            {organization.sam_gov_entity.legal_business_name}
          </option>
        ))}

        {/* Individual option - only if individual applicant type allowed */}
        {applicantTypes.includes("individual") && (
          <option key="individual" value={SPECIAL_VALUES.INDIVIDUAL}>
            {t("asIndividual")}
          </option>
        )}

        {/* Not listed option - only if organization applicant type allowed */}
        {applicantTypes.includes("organization") && (
          <option key="not-listed" value={SPECIAL_VALUES.NOT_LISTED}>
            {t("notListed")}
          </option>
        )}
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
        className="font-sans-sm margin-top-3 text-bold"
      >
        {t("label")} <span className="text-red">*</span>
      </Label>
      <div className="font-sans-2xs" style={{ maxWidth: "550px" }}>
        {t("description")}
      </div>
      {validationError && <ErrorMessage>{validationError}</ErrorMessage>}

      <TextInput
        validationStatus={validationError ? "error" : undefined}
        type="text"
        name="application-name"
        id="application-name"
        onChange={onNameChange}
        style={{ maxWidth: "550px" }}
      />
    </>
  );
};

export { SPECIAL_VALUES };

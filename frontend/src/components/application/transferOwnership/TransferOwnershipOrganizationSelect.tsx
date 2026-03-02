import type { UserOrganization } from "src/types/userTypes";

import { useTranslations } from "next-intl";

import { LabeledSelect } from "src/components/LabeledSelect";

type TransferOwnershipOrganizationSelectProps = {
  onOrganizationChange: (event: React.ChangeEvent<HTMLSelectElement>) => void;
  organizations: UserOrganization[];
  selectedOrganization?: string;
  validationError?: string;
  isDisabled?: boolean;
};

export function TransferOwnershipOrganizationSelect({
  onOrganizationChange,
  organizations,
  selectedOrganization,
  validationError,
  isDisabled,
}: TransferOwnershipOrganizationSelectProps) {
  const t = useTranslations("Application.transferOwnershipModal");

  return (
    <LabeledSelect<UserOrganization>
      label={t("selectTitle")}
      labelId="label-for-organization"
      selectId="transfer-organization"
      selectName="transfer-organization"
      value={selectedOrganization ?? ""}
      onChange={onOrganizationChange}
      placeholderLabel={t("default")}
      options={organizations}
      getOptionValue={(organization) => organization.organization_id}
      getOptionLabel={(organization) =>
        organization.sam_gov_entity.legal_business_name
      }
      validationError={validationError}
      isDisabled={isDisabled}
    />
  );
}

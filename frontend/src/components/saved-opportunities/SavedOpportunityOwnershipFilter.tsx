"use client";

import { useSearchParamUpdater } from "src/hooks/useSearchParamUpdater";
import { Organization } from "src/types/applicationResponseTypes";

import { useTranslations } from "next-intl";
import { useCallback, useMemo } from "react";
import { Select } from "@trussworks/react-uswds";

interface SavedOpportunityOwnershipFilterProps {
  organizations: Organization[];
  savedBy: string | null;
}

interface SavedOpportunityOwnershipFilterOption {
  value: string;
  label: string;
}

export default function SavedOpportunityOwnershipFilter({
  organizations,
  savedBy,
}: SavedOpportunityOwnershipFilterProps) {
  const { setQueryParam, removeQueryParam } = useSearchParamUpdater();
  const t = useTranslations("SavedOpportunities");

  const options = useMemo<SavedOpportunityOwnershipFilterOption[]>(() => {
    const sortedOrganizations = [...organizations].sort(
      (firstOrganization, secondOrganization) => {
        const firstOrganizationName =
          firstOrganization.sam_gov_entity?.legal_business_name?.trim() ?? "";
        const secondOrganizationName =
          secondOrganization.sam_gov_entity?.legal_business_name?.trim() ?? "";

        return firstOrganizationName.localeCompare(secondOrganizationName);
      },
    );

    return [
      {
        value: "all",
        label: t("ownershipFilter.showAll"),
      },
      {
        value: "individual",
        label: t("ownershipFilter.individual"),
      },
      ...sortedOrganizations.map((organization) => ({
        value: `organization:${organization.organization_id}`,
        label:
          organization.sam_gov_entity?.legal_business_name?.trim() ??
          organization.organization_id,
      })),
    ];
  }, [organizations, t]);

  const handleChange = useCallback(
    (event: React.ChangeEvent<HTMLSelectElement>) => {
      const newValue = event.target.value;

      if (!newValue || newValue === "all") {
        removeQueryParam("savedBy");
        return;
      }

      setQueryParam("savedBy", newValue);
    },
    [setQueryParam, removeQueryParam],
  );

  if (organizations.length === 0) {
    return null;
  }

  return (
    <div id="saved-opportunity-ownership-filter">
      <label
        htmlFor="saved-opportunity-ownership-select"
        className="usa-label tablet:display-inline-block tablet:margin-right-2"
      >
        {t("ownershipFilter.label")}
      </label>

      <Select
        id="saved-opportunity-ownership-select"
        name="saved-opportunity-ownership"
        onChange={handleChange}
        value={savedBy || "all"}
        className="tablet:display-inline-block tablet:width-auto"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </Select>
    </div>
  );
}

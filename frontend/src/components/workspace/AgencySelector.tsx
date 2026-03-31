"use client";

import { UserAgency } from "src/services/fetch/fetchers/userAgenciesFetcher";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { Label, Select } from "@trussworks/react-uswds";

export const AgencySelector = ({
  agencies,
  currentAgencyId,
  className,
}: {
  agencies: UserAgency[];
  currentAgencyId: string;
  className?: string;
}) => {
  const router = useRouter();
  const t = useTranslations("Opportunities");

  return (
    <div className={className ?? "usa-form-group margin-bottom-4"}>
      <Label htmlFor="agency-selector" className="text-bold">
        {t("agencySelector")}
      </Label>
      <Select
        id="agency-selector"
        name="agency"
        defaultValue={currentAgencyId}
        onChange={(e) => router.push(`?agency=${e.target.value}`)}
      >
        {agencies.map((agency) => (
          <option key={agency.agency_id} value={agency.agency_id}>
            {agency.agency_name}
          </option>
        ))}
      </Select>
    </div>
  );
};

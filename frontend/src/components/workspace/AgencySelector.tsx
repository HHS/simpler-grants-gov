"use client";

import { UserAgency } from "src/services/fetch/fetchers/userAgenciesFetcher";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";

export const AgencySelector = ({
  agencies,
  currentAgencyId,
}: {
  agencies: UserAgency[];
  currentAgencyId: string;
}) => {
  const router = useRouter();
  const t = useTranslations("Opportunities");

  return (
    <div className="usa-form-group margin-bottom-4">
      <label className="usa-label text-bold" htmlFor="agency-selector">
        {t("agencySelector")}
      </label>
      <select
        className="usa-select"
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
      </select>
    </div>
  );
};

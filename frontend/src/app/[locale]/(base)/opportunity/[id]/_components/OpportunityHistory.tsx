import { OpportunityDetail } from "src/types/opportunity/opportunityResponseTypes";
import { legacyOpportunityUrl } from "src/utils/opportunity/opportunityUtils";

import { useTranslations } from "next-intl";

import { USWDSIcon } from "src/components/core/USWDSIcon";
import {
  formatOptionalDate,
  OpportunityDetailItem,
  OpportunityDetailsCard,
  SECTION_HEADING_CLASSES,
} from "./OpportunityDetailItem";

type Props = {
  opportunityData: Pick<
    OpportunityDetail,
    "opportunity_status" | "summary" | "legacy_opportunity_id"
  >;
};

const OpportunityHistory = ({ opportunityData }: Props) => {
  const t = useTranslations("OpportunityListing.history");
  const notAvailable = useTranslations("OpportunityListing")("notAvailable");
  const {
    opportunity_status: status,
    summary,
    legacy_opportunity_id: legacyId,
  } = opportunityData;

  const postedDate = formatOptionalDate(summary.post_date);
  const version = summary.version_number
    ? `${summary.is_forecast ? t("forecastVersion") : t("synopsisVersion")} ${summary.version_number}`
    : notAvailable;

  return (
    <div className="margin-bottom-4">
      <h2 className={SECTION_HEADING_CLASSES}>{t("title")}</h2>
      <OpportunityDetailsCard>
        {/* forecasts often have no posted date yet, so it is hidden rather than shown as not available */}
        {(postedDate || status !== "forecasted") && (
          <OpportunityDetailItem label={t("postedDate")}>
            {postedDate || notAvailable}
          </OpportunityDetailItem>
        )}
        <OpportunityDetailItem
          label={status === "archived" ? t("archivedDate") : t("archiveDate")}
        >
          {formatOptionalDate(summary.archive_date) || notAvailable}
        </OpportunityDetailItem>
        <OpportunityDetailItem label={t("version")}>
          {version}
        </OpportunityDetailItem>
        {legacyId && (
          <p className="margin-y-1">
            <a
              className="usa-link"
              href={legacyOpportunityUrl(legacyId)}
              target="_blank"
              rel="noopener noreferrer"
            >
              {t("versionHistory")}
              <USWDSIcon name="launch" className="text-middle margin-left-05" />
            </a>
          </p>
        )}
      </OpportunityDetailsCard>
    </div>
  );
};

export default OpportunityHistory;

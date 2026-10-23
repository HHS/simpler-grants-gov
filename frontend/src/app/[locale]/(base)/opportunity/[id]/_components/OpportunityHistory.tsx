import {
  OpportunityStatus,
  Summary,
} from "src/types/opportunity/opportunityResponseTypes";

import { useTranslations } from "next-intl";

import {
  OpportunityHistoryItem,
  useFormatHistoryDate,
} from "./OpportunityHistoryItem";
import OpportunityIntro from "./OpportunityIntro";

const OpportunityHistory = ({
  summary,
  status,
  legacyOpportunityId,
}: {
  summary: Summary;
  status: OpportunityStatus;
  legacyOpportunityId: number;
}) => {
  const t = useTranslations("OpportunityListing.history");

  const isForecasted = status === "forecasted";

  const formatHistoryDate = useFormatHistoryDate();

  return (
    <div className="margin-top-4">
      <h2>{t("history")}</h2>
      <div className="border radius-md border-base-lighter padding-x-2">
        <ul className="usa-list usa-list--unstyled">
          <OpportunityHistoryItem
            title={t("version")}
            content={
              summary.version_number
                ? summary.version_number.toString()
                : t("notSpecified")
            }
          />
          {!(isForecasted && !summary.post_date) && (
            <OpportunityHistoryItem
              title={isForecasted ? t("forecastPostedDate") : t("postedDate")}
              content={formatHistoryDate(summary.post_date)}
            />
          )}
          <OpportunityHistoryItem
            title={t("archiveDate")}
            content={formatHistoryDate(summary.archive_date)}
          />
        </ul>
        <OpportunityIntro legacyOpportunityId={legacyOpportunityId} />
      </div>
    </div>
  );
};

export default OpportunityHistory;

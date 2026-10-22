import {
  OpportunityStatus,
  Summary,
} from "src/types/opportunity/opportunityResponseTypes";
import { formatDate } from "src/utils/dateUtil";

import { useTranslations } from "next-intl";

import OpportunityIntro from "./OpportunityIntro";

const formatHistoryDate = (date: string | null) => {
  return date === null ? "--" : formatDate(date);
};

export const OpportunityHistoryItem = ({
  title,
  content,
}: {
  title: string;
  content: string;
}) => {
  return (
    <div className="display-flex flex-wrap flex-align-baseline">
      <p className="margin-right-05 text-bold margin-y-1">{title}:</p>
      <p className="margin-y-1">{content}</p>
    </div>
  );
};

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

  return (
    <div className="margin-top-4">
      <h2>{t("history")}</h2>
      <div className="border radius-md border-base-lighter padding-x-2">
        <OpportunityHistoryItem
          title={t("version")}
          content={
            summary.version_number ? summary.version_number.toString() : "--"
          }
        />
        <OpportunityHistoryItem
          title={
            status === "forecasted" ? t("forecastPostedDate") : t("postedDate")
          }
          content={formatHistoryDate(summary.post_date)}
        />
        <OpportunityHistoryItem
          title={t("archiveDate")}
          content={formatHistoryDate(summary.archive_date)}
        />
        <OpportunityIntro legacyOpportunityId={legacyOpportunityId} />
      </div>
    </div>
  );
};

export default OpportunityHistory;

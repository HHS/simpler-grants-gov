import {
  OpportunityStatus,
  Summary,
} from "src/types/opportunity/opportunityResponseTypes";
import { formatDate } from "src/utils/dateUtil";

import { useTranslations } from "next-intl";

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
    <div>
      <p className={"text-bold"}>
        {title}
        {":"}
      </p>
      <p>{content}</p>
    </div>
  );
};

const OpportunityHistory = ({
  summary,
  status,
}: {
  summary: Summary;
  status: OpportunityStatus;
}) => {
  const t = useTranslations("OpportunityListing.history");

  return (
    <div className="margin-top-4">
      <h3>{t("history")}</h3>
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
    </div>
  );
};

export default OpportunityHistory;

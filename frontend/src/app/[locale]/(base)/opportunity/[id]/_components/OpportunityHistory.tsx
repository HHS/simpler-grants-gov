import {
  OpportunityStatus,
  Summary,
} from "src/types/opportunity/opportunityResponseTypes";
import { formatDate } from "src/utils/dateUtil";

import { useTranslations } from "next-intl";

import OpportunityIntro from "./OpportunityIntro";

export const OpportunityHistoryItem = ({
  title,
  content,
  description,
}: {
  title: string;
  content: string;
  description?: string | null;
}) => {
  return (
    <li className="margin-y-1">
      <span className="text-bold text-no-wrap">{title}:</span>{" "}
      <span>{content}</span>
      {description && <p className="margin-bottom-0">{description}</p>}
    </li>
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

  const isForecasted = status === "forecasted";

  const formatHistoryDate = (date: string | null) =>
    date ? formatDate(date) : t("notSpecified");

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

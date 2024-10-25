import { Summary } from "src/types/search/searchResponseTypes";
import { formatDate } from "src/utils/dateUtil";

import { useTranslations } from "next-intl";

type TranslationKeys =
  | "version"
  | "posted_date"
  | "closing_date"
  | "archive_date";

const formatHistoryDate = (date: string | null) => {
  return date === null ? "--" : formatDate(date);
};

export const OpportunityHistorySkeleton = ({
  summary,
}: {
  summary: Summary;
}) => {
  const t = useTranslations("OpportunityListing.history");

  const opportunityDates = {
    posted_date: summary.post_date,
    closing_date: summary.close_date,
    archive_date: summary.archive_date,
  };
  return (
    <div className="usa-prose margin-top-4">
      <h3>{t("title")}</h3>
      <div>
        <p className={"text-bold"}>{t("version")}:</p>
        <p className={"margin-top-0"}>{summary.version_number || "--"}</p>
      </div>
      {Object.entries(opportunityDates).map(([title, date], index) => (
        <div key={`historyInfo-${index}`}>
          <p className={"text-bold"}>
            {t(`${title as TranslationKeys}`)}
            {":"}
          </p>
          <p className={"margin-top-0"}>{formatHistoryDate(date)}</p>
        </div>
      ))}
    </div>
  );
};

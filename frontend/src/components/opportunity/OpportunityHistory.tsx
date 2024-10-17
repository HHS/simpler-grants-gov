import { Summary } from "src/types/opportunity/opportunityResponseTypes";
import { formatDate } from "src/utils/dateUtil";

import { useTranslations } from "next-intl";

type Props = {
  summary: Summary;
};

type TranslationKeys =
  | "version"
  | "posted_date"
  | "closing_date"
  | "archive_date";

const formatHistoryDate = (date: string | null) => {
  return date === null ? "--" : formatDate(date);
};

const OpportunityHistory = ({ summary }: Props) => {
  const t = useTranslations("OpportunityListing.history");
  const opportunityDates = {
    posted_date: summary.post_date,
    closing_date: summary.close_date,
    archive_date: summary.archive_date,
  };
  return (
    <div className="usa-prose margin-top-4">
      <h3>History</h3>
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

export default OpportunityHistory;

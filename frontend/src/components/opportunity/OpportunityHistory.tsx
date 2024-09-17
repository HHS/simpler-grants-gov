import { Opportunity } from "src/types/opportunity/opportunityResponseTypes";
import { formatDate } from "src/utils/dateUtil";
import { useTranslations } from "next-intl";

type Props = {
  opportunityData: Opportunity;
};

type TranslationKeys =
  | "version"
  | "posted_date"
  | "closing_date"
  | "archive_date";

const formatHistorySubContent = (content: string | null) => {
  return content === null ? "--" : formatDate(content);
};

const OpportunityHistory = ({ opportunityData }: Props) => {
  const t = useTranslations("OpportunityListing.history");
  const versionInfo = {
    version: "--",
    posted_date: opportunityData.summary.post_date,
    closing_date: opportunityData.summary.close_date,
    archive_date: opportunityData.summary.archive_date,
  };
  return (
    <div className="usa-prose margin-top-4">
      <h3>History</h3>
      {Object.entries(versionInfo).map(([title, content], index) => (
        <div key={`historyInfo-${index}`}>
          <p className={"text-bold"}>
            {t(`${title as TranslationKeys}`)}
            {":"}
          </p>
          <p className={"margin-top-0"}>{formatHistorySubContent(content)}</p>
        </div>
      ))}
    </div>
  );
};

export default OpportunityHistory;

import { Summary } from "src/types/opportunity/opportunityResponseTypes";
import { formatDate } from "src/utils/dateUtil";

import { useTranslations } from "next-intl";
import { ForecastOpportunityItem } from "./ForecastOpportunityItem";

type Props = {
  summary: Summary;
};

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
      <p className={"margin-top-0"}>{content}</p>
    </div>
  );
};



const OpportunityHistory = ({ summary }: Props) => {
  const t = useTranslations("OpportunityListing.history");

  return (
    <div className="usa-prose margin-top-4">
      <h3>{t("history")}</h3>
      <OpportunityHistoryItem
        title={t("version")}
        content={
          summary.version_number ? summary.version_number.toString() : "--"
        }
      />
      <OpportunityHistoryItem
        title={t("posted_date")}
        content={formatHistoryDate(summary.post_date)}
      />
      <OpportunityHistoryItem
        title={t("archive_date")}
        content={formatHistoryDate(summary.archive_date)}
      />
      <ForecastOpportunityItem summary={summary} />
    </div>
  );
};

export default OpportunityHistory;

import { Summary } from "src/types/opportunity/opportunityResponseTypes";
import { formatDate } from "src/utils/dateUtil";

import { useTranslations } from "next-intl";
import { OpportunityHistoryItem } from "./OpportunityHistory";

type Props = {
  summary: Summary;
};

const formatHistoryDate = (date: string | null) => {
    return date === null ? "--" : formatDate(date);
};

export const ForecastOpportunityItem = ({summary}: Props) => {

  const t = useTranslations("OpportunityListing.history");

  if(!summary.is_forecast) {
    return <div></div>
  }

  return (
    <div>
        <OpportunityHistoryItem
        title={t("forcasted_award_date")}
        content={formatHistoryDate(summary.forecasted_award_date)}
      />
      <OpportunityHistoryItem
        title={t("forcasted_post_date")}
        content={formatHistoryDate(summary.forecasted_post_date)}
      />
      <OpportunityHistoryItem
        title={t("forcasted_close_date")}
        content={formatHistoryDate(summary.forecasted_close_date)}
      />
      <OpportunityHistoryItem
        title={t("forcasted_close_date_description")}
        content={summary.forecasted_close_date_description ? summary.forecasted_close_date_description : ""}
      />
    </div>
  );
}
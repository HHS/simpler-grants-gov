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

  return (
    <div> 	
        <div className="padding-05">
          <OpportunityHistoryItem
            title={t("forecasted_post_date")}
            content={formatHistoryDate(summary.forecasted_post_date)}
          />
          <OpportunityHistoryItem
            title={t("forecasted_close_date")}
            content={formatHistoryDate(summary.forecasted_close_date)}
          />
          <OpportunityHistoryItem
            title={t("forecasted_close_date_description")}
            content={summary.close_date_description ? summary.close_date_description : t("forecasted_close_date_description_not_available")}
          />
          <OpportunityHistoryItem
            title={t("forecasted_award_date")}
            content={formatHistoryDate(summary.forecasted_award_date)}
          />
        </div>
    </div>
  );
}
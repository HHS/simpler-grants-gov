import { OpportunityDetail } from "src/types/opportunity/opportunityResponseTypes";
import { formatDate } from "src/utils/dateUtil";

import { useTranslations } from "next-intl";
import { OpportunityHistoryItem } from "./OpportunityHistory";

type Props = {
  detail: OpportunityDetail;
};

const formatHistoryDate = (date: string | null) => {
    return date === null ? "--" : formatDate(date);
};

const formatISOTimestamp = (date: string) => {
  const stamp = new Date(date)
  const time = stamp.toLocaleDateString('en-US', {year: 'numeric', month: 'long', day: 'numeric'});

  return time

}

export const ForecastOpportunityItem = ({detail}: Props) => {

  const t = useTranslations("OpportunityListing.history");

  return (
    <div> 	
        <div className="padding-05">
        <OpportunityHistoryItem
            title={t("forecasted_post_date")}
            content={formatHistoryDate(detail.summary.forecasted_post_date)}
        />
        <OpportunityHistoryItem
            title={t("forecasted_close_date")}
            content={formatHistoryDate(detail.summary.forecasted_close_date)}
        />
        <OpportunityHistoryItem
            title={t("forecasted_close_date_description")}
            content={detail.summary.close_date_description ? detail.summary.close_date_description : t("forecasted_close_date_description_not_available")}
        />
        <OpportunityHistoryItem
            title={t("forecasted_award_date")}
            content={formatHistoryDate(detail.summary.forecasted_award_date)}
        />
        <OpportunityHistoryItem
            title={t("forecasted_project_start_date")}
            content={formatHistoryDate(detail.summary.forecasted_project_start_date)}
        />
        <OpportunityHistoryItem
            title={t("fiscal_year")}
            content={`${detail.summary.fiscal_year ? detail.summary.fiscal_year : ""}`}
        />
        <OpportunityHistoryItem
            title={t("forecasted_last_updated")}
            content={formatISOTimestamp(detail.updated_at)}
        />
        </div>
    </div>
  );
}
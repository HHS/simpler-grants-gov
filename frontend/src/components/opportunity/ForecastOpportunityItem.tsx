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

export const ForecastOpportunityItem = ({ detail }: Props) => {
  const t = useTranslations("OpportunityListing.history");

  return (
    <div>
      <div className="padding-05">
        <OpportunityHistoryItem
          title={t("forecastedPostDate")}
          content={formatHistoryDate(detail.summary.forecasted_post_date)}
        />
        <OpportunityHistoryItem
          title={t("forecastedCloseDate")}
          content={formatHistoryDate(detail.summary.forecasted_close_date)}
        />
        <OpportunityHistoryItem
          title={t("forecastedCloseDateDescription")}
          content={
            detail.summary.close_date_description
              ? detail.summary.close_date_description
              : t("forecastedCloseDateDescriptionNotAvailable")
          }
        />
        <OpportunityHistoryItem
          title={t("forecastedAwardDate")}
          content={formatHistoryDate(detail.summary.forecasted_award_date)}
        />
        <OpportunityHistoryItem
          title={t("forecastedProjectStartDate")}
          content={formatHistoryDate(
            detail.summary.forecasted_project_start_date,
          )}
        />
        <OpportunityHistoryItem
          title={t("fiscalYear")}
          content={`${detail.summary.fiscal_year ? detail.summary.fiscal_year : ""}`}
        />
      </div>
    </div>
  );
};

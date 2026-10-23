import { OpportunityDetail } from "src/types/opportunity/opportunityResponseTypes";
import { formatDate } from "src/utils/dateUtil";

import { useTranslations } from "next-intl";

import { OpportunityHistoryItem } from "./OpportunityHistory";

type Props = {
  detail: OpportunityDetail;
};

export const ForecastOpportunityItem = ({ detail }: Props) => {
  const t = useTranslations("OpportunityListing.history");

  const formatHistoryDate = (date: string | null) =>
    date ? formatDate(date) : t("notSpecified");

  return (
    <div className="padding-05">
      <ul className="usa-list usa-list--unstyled">
        <OpportunityHistoryItem
          title={t("forecastedPostDate")}
          content={formatHistoryDate(detail.summary.forecasted_post_date)}
        />
        <OpportunityHistoryItem
          title={t("forecastedCloseDate")}
          content={formatHistoryDate(detail.summary.forecasted_close_date)}
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
          content={
            detail.summary.fiscal_year
              ? `${detail.summary.fiscal_year}`
              : t("notSpecified")
          }
        />
      </ul>
    </div>
  );
};

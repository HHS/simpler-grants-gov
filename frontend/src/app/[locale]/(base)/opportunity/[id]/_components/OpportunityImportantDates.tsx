import { OpportunityDetail } from "src/types/opportunity/opportunityResponseTypes";

import { useTranslations } from "next-intl";

import { ClosedOpportunityItem } from "./ClosedOpportunityItem";
import { ForecastOpportunityItem } from "./ForecastOpportunityItem";
import { PostedOpportunityItem } from "./PostedOpportunityItem";

const OpportunityImportantDates = ({
  detail,
}: {
  detail: OpportunityDetail;
}) => {
  const t = useTranslations("OpportunityListing.importantDates");
  const isForcasted = detail.summary.is_forecast;
  const opportunityStatus = detail.opportunity_status;

  return (
    <div>
      <h2>{t("title")}</h2>
      <div className="border radius-md border-base-lighter padding-x-2">
        {isForcasted && <ForecastOpportunityItem detail={detail} />}
        {opportunityStatus === "posted" && (
          <PostedOpportunityItem detail={detail} />
        )}
        {opportunityStatus === "closed" && (
          <ClosedOpportunityItem detail={detail} />
        )}
      </div>
    </div>
  );
};

export default OpportunityImportantDates;

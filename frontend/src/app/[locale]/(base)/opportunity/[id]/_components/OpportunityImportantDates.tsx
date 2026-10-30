import { OpportunityDetail } from "src/types/opportunity/opportunityResponseTypes";

import { useTranslations } from "next-intl";

import { ArchivedOpportunityItem } from "./ArchivedOpportunityItem";
import { ClosedOpportunityItem } from "./ClosedOpportunityItem";
import { ForecastOpportunityItem } from "./ForecastOpportunityItem";
import { PostedOpportunityItem } from "./PostedOpportunityItem";

const OpportunityImportantDates = ({
  detail,
}: {
  detail: OpportunityDetail;
}) => {
  const t = useTranslations("OpportunityListing.importantDates");
  const opportunityStatus = detail.opportunity_status;

  return (
    <div>
      <h2>{t("title")}</h2>
      <div className="border radius-md border-base-lighter padding-x-2">
        {!opportunityStatus && (
          <PostedOpportunityItem
            detail={{
              ...detail,
              summary: {
                ...detail.summary,
                close_date: null,
                close_date_description: null,
              },
            }}
          />
        )}
        {opportunityStatus === "forecasted" && (
          <ForecastOpportunityItem detail={detail} />
        )}
        {opportunityStatus === "posted" && (
          <PostedOpportunityItem detail={detail} />
        )}
        {opportunityStatus === "closed" && (
          <ClosedOpportunityItem detail={detail} />
        )}
        {opportunityStatus === "archived" && (
          <ArchivedOpportunityItem detail={detail} />
        )}
      </div>
    </div>
  );
};

export default OpportunityImportantDates;

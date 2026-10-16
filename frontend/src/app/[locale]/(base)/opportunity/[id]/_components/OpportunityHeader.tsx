import { environment } from "src/constants/environments";
import { OpportunityDetail } from "src/types/opportunity/opportunityResponseTypes";

import { GridContainer } from "@trussworks/react-uswds";

import { OpportunityApplyAction } from "./OpportunityApplyAction";
import { OpportunityHeaderContent } from "./OpportunityHeaderContent";
import OpportunityHeaderDetails from "./OpportunityHeaderDetails";

type Props = {
  opportunityData: OpportunityDetail;
  opportunitySaved: boolean;
};

/*
  Opportunity page header: title, key details, and the save / apply calls to action.
  Kept as its own full width region so it can be made to stick to the top of the page.
*/
const OpportunityHeader = ({ opportunityData, opportunitySaved }: Props) => {
  const grantsGovUrl = `${environment.LEGACY_HOST}/search-results-detail/${opportunityData.legacy_opportunity_id}`;

  return (
    <div
      className="bg-white border-bottom border-base-lighter"
      data-testid="opportunity-header"
    >
      <GridContainer className="padding-y-3 tablet-lg:padding-y-4">
        <OpportunityHeaderContent
          opportunityId={opportunityData.opportunity_id}
          opportunitySaved={opportunitySaved}
          opportunityTitle={opportunityData.opportunity_title}
          details={
            <OpportunityHeaderDetails opportunityData={opportunityData} />
          }
          applyAction={
            <OpportunityApplyAction
              competitions={opportunityData.competitions}
              grantsGovUrl={grantsGovUrl}
              legacyOpportunityId={opportunityData.legacy_opportunity_id}
              opportunityId={opportunityData.opportunity_id}
              opportunityStatus={opportunityData.opportunity_status}
              opportunityTitle={opportunityData.opportunity_title}
            />
          }
        />
      </GridContainer>
    </div>
  );
};

export default OpportunityHeader;

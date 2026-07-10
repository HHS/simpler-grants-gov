import { OpportunityCard } from "src/app/[locale]/(base)/workspace/applications/[applicationId]/_components/OpportunityCard";
import { OpportunityOverview } from "src/types/opportunity/opportunityResponseTypes";

import opportunityMock from "./opportunity.mock.json";

const meta = {
  title: "Components/Application/OpportunityCard",
  component: OpportunityCard,
  args: {
    opportunityOverview: opportunityMock as unknown as OpportunityOverview,
  },
};
export default meta;

export const Default = {};

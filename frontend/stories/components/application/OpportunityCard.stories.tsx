import { Meta } from "@storybook/react";

import { OpportunityCard } from "src/components/application/OpportunityCard";
import { BaseOpportunity, OpportunityOverview } from "src/types/opportunity/opportunityResponseTypes"
import opportunityMock from './opportunity.mock.json'
import { mapOpportunityOverview } from "src/components/application/mapOpportunity";

const mockData = mapOpportunityOverview(opportunityMock as unknown as BaseOpportunity)

const meta: Meta<OpportunityOverview> = {
  title: "Components/Application/OpportunityCard",
  component: OpportunityCard,
  args: {
    ...mockData
  },
};
export default meta;

export const Default = {};

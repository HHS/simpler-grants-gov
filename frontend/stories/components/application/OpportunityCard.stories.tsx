import { Meta } from "@storybook/nextjs";
import { OpportunityOverview } from "src/types/opportunity/opportunityResponseTypes";

import { OpportunityCard } from "src/components/application/OpportunityCard";
import opportunityMock from "./opportunity.mock.json";

const meta: Meta<typeof OpportunityCard> = {
  title: "Components/Application/OpportunityCard",
  component: OpportunityCard,
  args: {
    opportunityOverview: opportunityMock as unknown as OpportunityOverview,
  },
};
export default meta;

export const Default = {};

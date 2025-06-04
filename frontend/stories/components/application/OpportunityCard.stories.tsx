import { Meta } from "@storybook/react";
import {
  OpportunityOverview,
} from "src/types/opportunity/opportunityResponseTypes";

import { OpportunityCard } from "src/components/application/OpportunityCard";
import opportunityMock from "./opportunity.mock.json";

const meta: Meta<OpportunityOverview> = {
  title: "Components/Application/OpportunityCard",
  component: OpportunityCard,
  args: {
    ...opportunityMock,
  },
};
export default meta;

export const Default = {};

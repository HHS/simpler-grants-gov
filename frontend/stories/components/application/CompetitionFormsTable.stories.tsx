import { Meta } from "@storybook/react";
import { CompetitionForms } from "src/types/competitionsResponseTypes";

import { CompetitionFormsTable } from "src/components/workspace/CompetitionFormsTable";
import competitionMock from "./competition.mock.json";

const competitionForms = competitionMock.competition
  .competition_forms as unknown as CompetitionForms;

const meta: Meta<typeof CompetitionFormsTable> = {
  title: "Components/Application/CompetitionFormsTable",
  component: CompetitionFormsTable,
  args: {
    forms: competitionForms,
  },
};
export default meta;

export const Default = {};

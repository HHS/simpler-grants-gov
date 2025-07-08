import { Meta } from "@storybook/react";
import { ApplicationFormDetail } from "src/types/applicationResponseTypes";
import { CompetitionForms } from "src/types/competitionsResponseTypes";

import { ApplicationFormsTable } from "src/components/application/ApplicationFormsTable";
import competitionMock from "./competition.mock.json";

const competitionForms = competitionMock.competition
  .competition_forms as unknown as CompetitionForms;
const applicationForms =
  competitionMock.application_forms as unknown as ApplicationFormDetail[];

const meta: Meta<typeof ApplicationFormsTable> = {
  title: "Components/Application/CompetitionFormsTable",
  component: ApplicationFormsTable,
  args: {
    forms: competitionForms,
    applicationForms,
    applicationId: "12345",
  },
};
export default meta;

export const Default = {};

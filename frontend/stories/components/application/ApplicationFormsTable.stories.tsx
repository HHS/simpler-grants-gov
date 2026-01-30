import { Meta } from "@storybook/nextjs";
import { ApplicationDetail } from "src/types/applicationResponseTypes";

import { ApplicationFormsTable } from "src/components/application/ApplicationFormsTable";
import competitionMock from "./competition.mock.json";

const applicationDetailsObject: ApplicationDetail = {
  ...(competitionMock as unknown as ApplicationDetail),
  application_status: "in_progress",
  application_id: "12345",
  competition: {
    ...(competitionMock.competition as unknown as ApplicationDetail["competition"]),
    competition_instructions: [],
  },
};
const errors = null;

const meta: Meta<typeof ApplicationFormsTable> = {
  title: "Components/Application/CompetitionFormsTable",
  component: ApplicationFormsTable,
  args: {
    errors,
    applicationDetailsObject,
  },
};
export default meta;

export const Default = {};

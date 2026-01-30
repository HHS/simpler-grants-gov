import { Meta } from "@storybook/nextjs";

import {
  ApplicationDetailsCardProps,
  InformationCard,
} from "src/components/application/InformationCard";
import applicationMock from "./application.mock.json";

const meta: Meta<typeof InformationCard> = {
  title: "Components/Application/InformationCard",
  component: InformationCard,
  args: {
    applicationDetails:
      applicationMock as unknown as ApplicationDetailsCardProps,
  },
};
export default meta;

export const Default = {};

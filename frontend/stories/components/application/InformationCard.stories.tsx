import {
  ApplicationDetailsCardProps,
  InformationCard,
} from "src/components/application/InformationCard";
import applicationMock from "./application.mock.json";

const meta = {
  title: "Components/Application/InformationCard",
  component: InformationCard,
  args: {
    applicationDetails:
      applicationMock as unknown as ApplicationDetailsCardProps,
  },
};
export default meta;

export const Default = {};

import { Meta } from "@storybook/react";
import Loading from "src/app/[locale]/search/loading";

const meta: Meta<typeof Loading> = {
  component: Loading,
};
export default meta;

export const Default = {
  args: {
    message: "Loading Storybook",
  },
};

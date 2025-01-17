import { Meta } from "@storybook/react";

import Loading from "src/components/Loading";

const meta: Meta<typeof Loading> = {
  component: Loading,
};
export default meta;

export const Default = {
  args: {
    message: "Loading Storybook",
  },
};

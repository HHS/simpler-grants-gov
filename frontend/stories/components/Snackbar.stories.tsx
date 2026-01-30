import { Meta } from "@storybook/nextjs";

import Snackbar from "src/components/Snackbar";

const meta: Meta<typeof Snackbar> = {
  title: "Components/Snackbar",
  component: Snackbar,
  args: {
    isVisible: true,
    children: (
      <>
        {"This is a snackbar"}
        <br />
        {"This is a second line"}
      </>
    ),
  },
};
export default meta;

export const Default = {};

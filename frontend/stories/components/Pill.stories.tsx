import { Meta } from "@storybook/nextjs";

import { Pill } from "src/components/Pill";

const meta: Meta<typeof Pill> = {
  title: "Components/Pill",
  component: Pill,
};
export default meta;

export const Default = {
  args: {
    label: "All Department of Agriculture",
    // eslint-disable-next-line
    onClose: () => console.log("close pill!"),
  },
};

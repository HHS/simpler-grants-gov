import { Meta } from "@storybook/react";

import { Pill } from "src/components/Pill";

const meta: Meta<typeof Pill> = {
  title: "Components/Pill",
  component: Pill,
};
export default meta;

export const Default = {
  args: {
    label: "Pill",
    onClose: () => console.log("close pill!"),
  },
};

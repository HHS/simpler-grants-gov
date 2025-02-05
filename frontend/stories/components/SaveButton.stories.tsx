import { Meta } from "@storybook/react";

import SaveButton from "src/components/SaveButton";

const meta: Meta<typeof SaveButton> = {
  title: "Components/SaveButton",
  component: SaveButton,
  args: {
    defaultText: "Save",
    savedText: "Saved",
    loadingText: "Updating",
    messageText: "This opportunity was saved to Saved grants.",
    message: true,
  },
};
export default meta;

export const Default = {};

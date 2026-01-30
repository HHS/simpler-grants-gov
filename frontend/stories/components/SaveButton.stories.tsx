import { Meta } from "@storybook/nextjs";

import SaveButton from "src/components/SaveButton";

const meta: Meta<typeof SaveButton> = {
  title: "Components/SaveButton",
  component: SaveButton,
  args: {
    defaultText: "Save",
    buttonId: "save-button",
    savedText: "Saved",
    loadingText: "Updating",
    messageText: "This opportunity was saved to Saved opportunities.",
    message: true,
  },
};
export default meta;

export const Default = {};

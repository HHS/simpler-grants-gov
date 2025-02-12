import { Meta } from "@storybook/react";

import SimplerButton from "src/components/SimplerButton";

const meta: Meta<typeof SimplerButton> = {
  title: "Components/SimplerButton",
  component: SimplerButton,
  args: {
    children: "Save",
    loadingText: "Updating",
  },
  argTypes: {
    icon: {
      control: { type: "select" },
      options: [
        "add",
        "arrow_downward",
        "autorenew",
        "check",
        "content_copy",
        "delete",
        "file_download",
        "favorite",
        "favorite_border",
        "star",
        "star_outline",
      ],
    },
  },
};
export default meta;

export const Default = {};

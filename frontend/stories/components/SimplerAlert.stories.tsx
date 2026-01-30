import { Meta } from "@storybook/nextjs";

import SimplerAlert from "src/components/SimplerAlert";

const meta: Meta<typeof SimplerAlert> = {
  title: "Components/SimplerAlert",
  component: SimplerAlert,
  args: {
    buttonId: "test-button",
    messageText: "Test message",
    type: "error",
  },
};
export default meta;

export const Default = {};

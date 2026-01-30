import type { Meta, StoryObj } from "@storybook/nextjs";

import React from "react";

import InfoTooltip from "src/components/InfoTooltip";

const meta = {
  title: "Components/InfoTooltip",
  component: InfoTooltip,
  argTypes: {
    position: {
      control: {
        type: "select",
        options: ["top", "bottom", "left", "right"],
      },
    },
  },
  decorators: [
    (Story) => (
      <div style={{ padding: "50px" }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof InfoTooltip>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    text: "This is an informational tooltip",
    position: "top",
  },
};

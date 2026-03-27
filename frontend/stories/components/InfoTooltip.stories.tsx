import React, { ElementType } from "react";

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
    (Story: ElementType) => (
      <div style={{ padding: "50px" }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;

export const Default = {
  args: {
    text: "This is an informational tooltip",
    position: "top",
  },
};

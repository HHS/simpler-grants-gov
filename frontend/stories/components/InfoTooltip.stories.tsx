import { Meta, StoryFn } from "@storybook/react";

import React from "react";

import InfoTooltip, {
  InfoTooltipProps,
} from "../../src/components/InfoTooltip";

const decorators = [
  (Story: StoryFn) => (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "50vh" }}>
      <Story />
    </div>
  ),
];

export default {
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
  decorators,
} as Meta;

const Template: StoryFn<InfoTooltipProps> = (args: InfoTooltipProps) => (
  <InfoTooltip {...args} />
);

export const Default = Template.bind({});
Default.args = {
  text: "This is an informational tooltip",
  position: "top",
};

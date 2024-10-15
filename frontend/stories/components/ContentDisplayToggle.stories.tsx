import { Meta } from "@storybook/react";
import { identity } from "lodash";

import ContentDisplayToggle from "src/components/ContentDisplayToggle";

const meta: Meta<typeof ContentDisplayToggle> = {
  title: "Components/ContentDisplayToggle",
  component: ContentDisplayToggle,
};
export default meta;

export const Default = {
  args: {
    setToggledContentVisible: identity,
    toggledContentVisible: false,
    toggleText: "Toggle Me",
  },
};

import { identity } from "lodash";

import ContentDisplayToggle from "src/components/core/ContentDisplayToggle";

const meta = {
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

import { ElementType } from "react";

import Snackbar from "src/components/core/Snackbar";

const meta = {
  title: "Components/Snackbar",
  component: Snackbar,
  decorators: [
    (Story: ElementType) => (
      <div style={{ minHeight: "120px" }}>
        <Story />
      </div>
    ),
  ],
  args: {
    isVisible: true,
    children: (
      <>
        {"This is a snackbar"}
        <br />
        {"This is a second line"}
      </>
    ),
  },
};
export default meta;

export const Default = {};

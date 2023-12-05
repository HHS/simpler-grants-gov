import { Meta } from "@storybook/react";

import ContentLayout from "src/components/ContentLayout";

const meta: Meta<typeof ContentLayout> = {
  title: "Components/Layout/ContentLayout",
  component: ContentLayout,
};
export default meta;

export const Default = {
  args: {
    title: "This is a Content Layout Component",
    children:
      "This is some content. You can remove the title or make it a smaller font. You can also remove the border on the bottom. This section should be formatted as a react component.",
  },
};

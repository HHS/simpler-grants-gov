import { Meta } from "@storybook/react";

import WtGIContent from "src/components/WtGIContent";

const meta: Meta<typeof WtGIContent> = {
  title: "Components/Content/Ways to Get Involved Content",
  component: WtGIContent,
};
export default meta;

export const Default = {
  parameters: {
    design: {
      type: "figma",
      url: "https://www.figma.com/file/lpKPdyTyLJB5JArxhGjJnE/beta.grants.gov?type=design&node-id=14-1125&mode=design&t=nSr4QJesyQb2OH30-4",
    },
  },
};

import { Meta } from "@storybook/react";
import IndexResearchContent from "src/pages/content/IndexResearchContent";

const meta: Meta<typeof IndexResearchContent> = {
  title: "Components/Content/Index Research Content",
  component: IndexResearchContent,
};
export default meta;

export const Default = {
  parameters: {
    design: {
      type: "figma",
      url: "https://www.figma.com/file/lpKPdyTyLJB5JArxhGjJnE/beta.grants.gov?type=design&node-id=918-1668&mode=design&t=MT9uU0mTxDgymbFg-4",
    },
  },
};

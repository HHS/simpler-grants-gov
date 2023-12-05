import { Meta } from "@storybook/react";
import ResearchContent from "src/pages/content/IndexResearchContent";

const meta: Meta<typeof ResearchContent> = {
  title: "Components/Content/Research Content",
  component: ResearchContent,
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

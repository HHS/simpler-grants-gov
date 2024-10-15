import { Meta } from "@storybook/react";
import ResearchImpact from "src/app/[locale]/research/ResearchImpact";

const meta: Meta<typeof ResearchImpact> = {
  title: "Components/Content/Research Impact Content",
  component: ResearchImpact,
};
export default meta;

export const Default = {
  parameters: {
    design: {
      type: "figma",
      url: "https://www.figma.com/file/lpKPdyTyLJB5JArxhGjJnE/beta.grants.gov?type=design&node-id=918-1829&mode=design&t=asZDwYSxN5FONKDO-4",
    },
  },
};

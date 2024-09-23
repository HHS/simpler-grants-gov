import { Meta } from "@storybook/react";
import ResearchThemes from "src/app/[locale]/research/ResearchThemes";

const meta: Meta<typeof ResearchThemes> = {
  title: "Components/Content/Research Themes Content",
  component: ResearchThemes,
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

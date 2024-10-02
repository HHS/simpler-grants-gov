import { Meta } from "@storybook/react";
import ResearchMethodology from "src/app/[locale]/research/ResearchMethodology";

const meta: Meta<typeof ResearchMethodology> = {
  title: "Components/Content/Research Methodology Content",
  component: ResearchMethodology,
};
export default meta;

export const Default = {
  parameters: {
    design: {
      type: "figma",
      url: "https://www.figma.com/file/lpKPdyTyLJB5JArxhGjJnE/beta.grants.gov?type=design&node-id=918-1791&mode=design&t=8okOjJ5iNL1W8x45-4",
    },
  },
};

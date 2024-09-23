import { Meta } from "@storybook/react";
import ResearchArchetypes from "src/app/[locale]/research/ResearchArchetypes";

const meta: Meta<typeof ResearchArchetypes> = {
  title: "Components/Content/Research Archetypes Content",
  component: ResearchArchetypes,
};
export default meta;

export const Default = {
  parameters: {
    design: {
      type: "figma",
      url: "https://www.figma.com/file/lpKPdyTyLJB5JArxhGjJnE/beta.grants.gov?type=design&node-id=918-1801&mode=design&t=8okOjJ5iNL1W8x45-4",
    },
  },
};

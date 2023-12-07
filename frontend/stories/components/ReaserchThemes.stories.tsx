import { Meta } from "@storybook/react";
import ResearchIntro from "src/pages/content/ResearchIntro";

const meta: Meta<typeof ResearchIntro> = {
  title: "Components/Content/Research Intro Content",
  component: ResearchIntro,
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

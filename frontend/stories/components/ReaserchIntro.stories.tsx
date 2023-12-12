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
      url: "https://www.figma.com/file/lpKPdyTyLJB5JArxhGjJnE/beta.grants.gov?type=design&node-id=918-1784&mode=design&t=8okOjJ5iNL1W8x45-4",
    },
  },
};

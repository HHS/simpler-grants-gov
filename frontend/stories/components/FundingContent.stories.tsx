import { Meta } from "@storybook/react";

import FundingContent from "src/components/FundingContent";

const meta: Meta<typeof FundingContent> = {
  title: "Components/Content/Funding Content",
  component: FundingContent,
};
export default meta;

export const Default = {
  parameters: {
    design: {
      type: "figma",
      url: "https://www.figma.com/file/lpKPdyTyLJB5JArxhGjJnE/beta.grants.gov?type=design&node-id=14-907&mode=design&t=gEXdEnzZUfuODXut-4",
    },
  },
};

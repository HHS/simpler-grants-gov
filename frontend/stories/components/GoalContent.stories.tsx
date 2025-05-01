import { Meta } from "@storybook/react";

import GoalContent from "src/components/homepage/sections/HomepageExperimental";

const meta: Meta<typeof GoalContent> = {
  title: "Components/Content/Goal Content",
  component: GoalContent,
};
export default meta;

export const Default = {
  parameters: {
    design: {
      type: "figma",
      url: "https://www.figma.com/file/lpKPdyTyLJB5JArxhGjJnE/beta.grants.gov?type=design&node-id=14-830&mode=design&t=S3j65DqL38Dpg3qK-4",
    },
  },
};

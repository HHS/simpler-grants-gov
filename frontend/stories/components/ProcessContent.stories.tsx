import { Meta } from "@storybook/react";
import ProcessContent from "src/app/[locale]/process/ProcessIntro";

const meta: Meta<typeof ProcessContent> = {
  title: "Components/Content/Process Content",
  component: ProcessContent,
};
export default meta;

export const Default = {
  parameters: {
    design: {
      type: "figma",
      url: "https://www.figma.com/proto/lpKPdyTyLJB5JArxhGjJnE/beta.grants.gov?node-id=918-1768&starting-point-node-id=918%3A1623&hide-ui=1",
    },
  },
};

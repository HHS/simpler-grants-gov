import { Meta } from "@storybook/react";
import ProcessContent from "src/pages/content/IndexProcessContent";

const meta: Meta<typeof ProcessContent> = {
  title: "Components/Content/Process Content",
  component: ProcessContent,
};
export default meta;

export const Default = {
  parameters: {
    design: {
      type: "figma",
      url: "https://www.figma.com/file/lpKPdyTyLJB5JArxhGjJnE/beta.grants.gov?type=design&node-id=918-1656&mode=design&t=MT9uU0mTxDgymbFg-4",
    },
  },
};

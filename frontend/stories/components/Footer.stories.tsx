import { Meta } from "@storybook/react";

import Footer from "src/components/Footer";

const meta: Meta<typeof Footer> = {
  title: "Components/Layout/Footer",
  component: Footer,
};
export default meta;

export const Default = {
  parameters: {
    design: {
      type: "figma",
      url: "https://www.figma.com/file/lpKPdyTyLJB5JArxhGjJnE/beta.grants.gov?type=design&node-id=1-1930&mode=design&t=2tvBEtkEXZoEnYg4-4",
    },
  },
};

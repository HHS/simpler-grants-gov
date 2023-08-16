import { Meta } from "@storybook/react";

import Hero from "src/components/Hero";

const meta: Meta<typeof Hero> = {
  title: "Components/Hero",
  component: Hero,
};
export default meta;

export const Default = {
  parameters: {
    design: {
      type: "figma",
      url: "https://www.figma.com/file/lpKPdyTyLJB5JArxhGjJnE/beta.grants.gov?type=design&node-id=14-754&mode=design&t=KpB2R08k4fhBL2DJ-4",
    },
  },
};

export const WithProps = {
  parameters: {
    ...Default.parameters,
  },
  args: {
  },
};

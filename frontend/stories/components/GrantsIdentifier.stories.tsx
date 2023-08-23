import { Meta } from "@storybook/react";

import GrantsIdentifier from "src/components/GrantsIdentifier";

const meta: Meta<typeof GrantsIdentifier> = {
  title: "Components/Layout/Identifier",
  component: GrantsIdentifier,
};
export default meta;

export const Default = {
  parameters: {
    design: {
      type: "figma",
      url: "https://www.figma.com/file/lpKPdyTyLJB5JArxhGjJnE/beta.grants.gov?type=design&node-id=1-1931&mode=design&t=XoFxd2BcN1VvLQhm-4",
    },
  },
};

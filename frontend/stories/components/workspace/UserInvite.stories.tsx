import { Meta } from "@storybook/react";

import { UserInvite } from "src/components/workspace/UserOrganizationInvite";

const meta: Meta<typeof UserInvite> = {
  title: "Components/UserInvite",
  component: UserInvite,
};
export default meta;

export const Default = {
  parameters: {
    organizationId: "1",
  },
};

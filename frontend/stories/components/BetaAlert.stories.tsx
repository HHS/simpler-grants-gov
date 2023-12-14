import { Meta } from "@storybook/react";

import BetaAlert from "src/components/BetaAlert";

const meta: Meta<typeof BetaAlert> = {
  title: "Components/BetaAlert",
  component: BetaAlert,
};
export default meta;

export const Default = {
  parameters: {
    design: {
      type: "figma",
      url: "https://www.figma.com/file/lpKPdyTyLJB5JArxhGjJnE/beta.grants.gov?type=design&node-id=2157-633&mode=design&t=JS0JebJ4QTnv0jor-0",
    },
  },
};

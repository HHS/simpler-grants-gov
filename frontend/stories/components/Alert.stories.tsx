import { Meta } from "@storybook/react";

import Alert from "src/components/Alert";

const meta: Meta<typeof Alert> = {
  component: Alert,
};
export default meta;

export const Success = {
  parameters: {
    design: {
      type: "figma",
      url: "https://www.figma.com/file/lpKPdyTyLJB5JArxhGjJnE/beta.grants.gov?type=design&node-id=14-898&mode=design&t=TBiGeE1zwkTfNzxB-4",
    },
  },
  args: {
    type: "success",
    children: "This is a success Alert",
  },
};

export const Warning = {
  parameters: Success.parameters,
  args: {
    type: "warning",
    children: "This is a warning Alert",
  },
};

export const Error = {
  parameters: Success.parameters,
  args: {
    type: "error",
    children: "This is an error Alert",
  },
};

export const Info = {
  parameters: Success.parameters,
  args: {
    type: "info",
    children: "This is an info Alert",
  },
};

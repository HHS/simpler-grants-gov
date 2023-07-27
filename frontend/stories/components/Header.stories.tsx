import { Meta } from "@storybook/react";

import Header from "src/components/Header";

const meta: Meta<typeof Header> = {
  title: "Components/Layout/Header",
  component: Header,
};
export default meta;

export const Default = {
  parameters: {
    design: {
      type: "figma",
      url: "https://www.figma.com/file/lpKPdyTyLJB5JArxhGjJnE/beta.grants.gov",
    },
  },
};

export const WithProps = {
  parameters: {
    ...Default.parameters,
  },
  args: {
    logoPath: "/img/logo.svg",
    primaryLinks: [
      {
        i18nKey: "nav_link_home",
        href: "/",
      },
      {
        i18nKey: "nav_link_health",
        href: "/health",
      },
    ],
  },
};

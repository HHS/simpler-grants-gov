import { Meta } from "@storybook/react";

import Header from "src/components/Header";

const meta: Meta<typeof Header> = {
  title: 'Components/Layout/Header',
  component: Header,
};
export default meta;

export const Default = {
};

export const WithProps = {
  args: {
    logoPath: '/img/logo.svg',
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
    showMenu: true
  }
};

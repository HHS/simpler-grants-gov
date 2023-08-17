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
      url: "https://www.figma.com/file/lpKPdyTyLJB5JArxhGjJnE/beta.grants.gov?type=design&node-id=1-1882&mode=design&t=xjsnXcLzBSmyUoXT-4",
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

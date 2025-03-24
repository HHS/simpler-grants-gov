import { Meta } from "@storybook/react";
import { RESEARCH_CRUMBS } from "src/constants/breadcrumbs";

import Breadcrumbs from "src/components/Breadcrumbs";

const meta: Meta<typeof Breadcrumbs> = {
  title: "Components/Breadcrumbs",
  component: Breadcrumbs,
};
export default meta;

export const Home = {
  parameters: {
    design: {
      type: "figma",
      url: "https://www.figma.com/file/lpKPdyTyLJB5JArxhGjJnE/beta.grants.gov?type=design&node-id=918%3A1698&mode=design&t=rKuHZ4QiepVfLvwq-1",
    },
  },
  args: {
    breadcrumbList: [{ title: "Home", path: "/" }],
  },
};

export const Research = {
  parameters: Home.parameters,
  args: {
    breadcrumbList: RESEARCH_CRUMBS,
  },
};

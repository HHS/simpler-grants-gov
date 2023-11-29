import { Meta } from "@storybook/react";

import Breadcrumbs from "src/components/Breadcrumbs";
import { RESEARCH_CRUMBS, PROCESS_CRUMBS } from "src/constants/breadcrumbs";

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
    breadcrumbList: [{title: "Home", path: "/"}],
  },
};

export const Research = {
  parameters: Home.parameters,
  args: {
    breadcrumbList: RESEARCH_CRUMBS,
  },
};

export const Process = {
  parameters: Home.parameters,
  args: {
    breadcrumbList: PROCESS_CRUMBS,
  },
};
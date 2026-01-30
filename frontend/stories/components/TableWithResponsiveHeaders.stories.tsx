import { Meta } from "@storybook/nextjs";
import {
  fakeResponsiveTableHeaders,
  fakeResponsiveTableRows,
} from "src/utils/testing/fixtures";

import { TableWithResponsiveHeader } from "src/components/TableWithResponsiveHeader";

const meta: Meta<typeof TableWithResponsiveHeader> = {
  title: "Components/TableWithResponsiveHeader",
  component: TableWithResponsiveHeader,
  args: {
    headerContent: [],
    tableRowData: [],
  },
};
export default meta;

export const Default = {
  args: {
    headerContent: fakeResponsiveTableHeaders,
    tableRowData: fakeResponsiveTableRows,
  },
};

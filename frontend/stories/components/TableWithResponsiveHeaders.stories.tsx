import {
  fakeResponsiveTableHeaders,
  fakeResponsiveTableRows,
} from "src/utils/testing/fixtures";

import { TableWithResponsiveHeader } from "src/components/TableWithResponsiveHeader";

const meta = {
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

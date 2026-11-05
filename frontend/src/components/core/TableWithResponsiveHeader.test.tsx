import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import {
  fakeResponsiveTableHeaders,
  fakeResponsiveTableRows,
} from "src/utils/testing/fixtures";

import { useState } from "react";

import { TableWithResponsiveHeader } from "src/components/core/TableWithResponsiveHeader";

const ClickCounter = ({ label }: { label: string }) => {
  const [count, setCount] = useState(0);
  return (
    <button type="button" onClick={() => setCount(count + 1)}>
      {label} {count}
    </button>
  );
};

const counterTable = (labels: string[]) => (
  <TableWithResponsiveHeader
    headerContent={[{ cellData: "counter" }]}
    tableRowData={labels.map((label) => [
      { cellData: <ClickCounter label={label} /> },
    ])}
    rowKeys={labels}
  />
);

// this does not directly test responsive aspects of the component, that should be done in e2e tests
// see https://github.com/HHS/simpler-grants-gov/issues/5414
describe("TableWithResponsiveHeader", () => {
  it("passes accessibility test", async () => {
    const component = TableWithResponsiveHeader({
      headerContent: fakeResponsiveTableHeaders,
      tableRowData: fakeResponsiveTableRows,
    });
    const { container } = render(component);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
  it("displays header content in table header", () => {
    render(
      <TableWithResponsiveHeader
        headerContent={fakeResponsiveTableHeaders}
        tableRowData={fakeResponsiveTableRows}
      />,
    );

    expect(
      screen.getByRole("columnheader", { name: "hi" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("columnheader", { name: "a heading" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("columnheader", { name: "table header cell" }),
    ).toBeInTheDocument();
  });
  it("displays header content (hidden) in table body", () => {
    render(
      <TableWithResponsiveHeader
        headerContent={fakeResponsiveTableHeaders}
        tableRowData={fakeResponsiveTableRows}
      />,
    );

    expect(screen.getByTestId("responsive-header-0-0")).toHaveTextContent("hi");
    expect(screen.getByTestId("responsive-header-0-0")).toHaveClass(
      "tablet-lg:display-none",
    );
    expect(screen.getByTestId("responsive-header-0-1")).toHaveTextContent(
      "a heading",
    );
    expect(screen.getByTestId("responsive-header-0-1")).toHaveClass(
      "tablet-lg:display-none",
    );
    expect(screen.getByTestId("responsive-header-0-2")).toHaveTextContent(
      "table header cell",
    );
    expect(screen.getByTestId("responsive-header-0-2")).toHaveClass(
      "tablet-lg:display-none",
    );
  });
  it("displays table content in table body rows", () => {
    render(
      <TableWithResponsiveHeader
        headerContent={fakeResponsiveTableHeaders}
        tableRowData={fakeResponsiveTableRows}
      />,
    );

    expect(screen.getByTestId("responsive-data-0-0")).toHaveTextContent(
      "hi from row one",
    );
    expect(screen.getByTestId("responsive-data-0-1")).toHaveTextContent(
      "i am column two",
    );
    expect(screen.getByTestId("responsive-data-0-2")).toHaveTextContent(
      "some data",
    );

    expect(screen.getByTestId("responsive-data-1-0")).toHaveTextContent(
      "hi from row two",
    );
    expect(screen.getByTestId("responsive-data-1-1")).toHaveTextContent(
      "still column two",
    );
    expect(screen.getByTestId("responsive-data-1-2")).toHaveTextContent(
      "some more data",
    );

    expect(screen.getByTestId("responsive-data-2-0")).toHaveTextContent(
      "hi from row three",
    );
    expect(screen.getByTestId("responsive-data-2-1")).toHaveTextContent(
      "column two",
    );
    expect(screen.getByTestId("responsive-data-2-2")).toHaveTextContent(
      "even more data",
    );
  });
  it("hides content with negative stack order", () => {
    render(
      <TableWithResponsiveHeader
        headerContent={fakeResponsiveTableHeaders}
        tableRowData={fakeResponsiveTableRows}
      />,
    );

    expect(
      screen.getByRole("cell", { name: "table header cell some data" }),
    ).toHaveClass("display-none");
    expect(
      screen.getByRole("cell", { name: "table header cell some more data" }),
    ).toHaveClass("display-none");
    expect(
      screen.getByRole("cell", { name: "table header cell even more data" }),
    ).toHaveClass("display-none");
  });
  it("applies stack order when present", () => {
    render(
      <TableWithResponsiveHeader
        headerContent={fakeResponsiveTableHeaders}
        tableRowData={fakeResponsiveTableRows}
      />,
    );

    expect(
      screen.getByRole("cell", { name: "hi hi from row one" }),
    ).toHaveClass("order-1");
    expect(
      screen.getByRole("cell", { name: "a heading i am column two" }),
    ).toHaveClass("order-0");
  });
  it("does not render if all table rows do not have the same number of items as the headers", () => {
    render(
      <TableWithResponsiveHeader
        headerContent={fakeResponsiveTableHeaders.concat([
          { cellData: "superfluous" },
        ])}
        tableRowData={fakeResponsiveTableRows}
      />,
    );

    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });
  it("keeps stateful cell content with its row when rowKeys are provided", async () => {
    const user = userEvent.setup();
    const { rerender } = render(counterTable(["first", "second"]));

    await user.click(screen.getByRole("button", { name: "first 0" }));

    // a new row added at the top should not take over the existing row's state
    rerender(counterTable(["new", "first", "second"]));

    expect(screen.getByRole("button", { name: "new 0" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "first 1" })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "second 0" }),
    ).toBeInTheDocument();
  });
});

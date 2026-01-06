import { render, screen } from "@testing-library/react";
import { axe } from "jest-axe";
import {
  fakeResponsiveTableHeaders,
  fakeResponsiveTableRows,
} from "src/utils/testing/fixtures";

import { TableWithResponsiveHeader } from "src/components/TableWithResponsiveHeader";

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
  it("does not render if rows do not match header length", () => {
    const consoleSpy = jest
      .spyOn(console, "error")
      .mockImplementation((): void => undefined);

    try {
      render(
        <TableWithResponsiveHeader
          headerContent={fakeResponsiveTableHeaders.concat([
            { cellData: "superfluous" },
          ])}
          tableRowData={fakeResponsiveTableRows}
        />,
      );

      expect(screen.queryByRole("table")).not.toBeInTheDocument();
    } finally {
      consoleSpy.mockRestore();
    }
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
});

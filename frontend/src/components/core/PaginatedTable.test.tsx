import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { PaginatedTable } from "./PaginatedTable";

const mockHeaders = [
  { id: "col1", name: "Column 1" },
  { id: "col2", name: "Column 2" },
];

const mockRows = Array.from({ length: 25 }, (_, i) => ({
  id: `row-${i + 1}`,
  col1: `Value 1-${i + 1}`,
  col2: `Value 2-${i + 1}`,
}));

jest.mock("src/components/core/TableWithResponsiveHeader", () => ({
  TableWithResponsiveHeader: ({ tableRowData }: { tableRowData: any[] }) => (
    <table data-testid="mock-responsive-table">
      <tbody>
        {tableRowData.map((row: any) => (
          <tr key={row.id}>
            <td>{row.col1}</td>
            <td>{row.col2}</td>
          </tr>
        ))}
      </tbody>
    </table>
  ),
}));

describe("PaginatedTable Component", () => {
  it("renders data correctly on initial load", async () => {
    const fetchData = jest.fn().mockResolvedValue({
      data: mockRows.slice(0, 10),
      totalPages: 3,
      totalItems: 25,
    });

    render(
      <PaginatedTable
        headerContent={mockHeaders}
        fetchData={fetchData}
        pageSize={10}
      />
    );

    expect(screen.getByText("Loading table data...")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByTestId("mock-responsive-table")).toBeInTheDocument();
    });

    expect(fetchData).toHaveBeenCalledWith(1, 10);
    expect(screen.getByText("Value 1-1")).toBeInTheDocument();
    expect(screen.getByText("Showing 1–10 of 25 items")).toBeInTheDocument();
  });

  it("handles page navigation (next and previous)", async () => {
    const fetchData = jest.fn().mockImplementation((page: number, pageSize: number) => {
      const start = (page - 1) * pageSize;
      return Promise.resolve({
        data: mockRows.slice(start, start + pageSize),
        totalPages: 3,
        totalItems: 25,
      });
    });

    render(
      <PaginatedTable
        headerContent={mockHeaders}
        fetchData={fetchData}
        pageSize={10}
      />
    );

    await waitFor(() => {
      expect(screen.getByText("Value 1-1")).toBeInTheDocument();
    });

    const nextButton = screen.getByRole("button", { name: "Go to next page" });
    fireEvent.click(nextButton);

    await waitFor(() => {
      expect(screen.getByText("Value 1-11")).toBeInTheDocument();
    });
    expect(fetchData).toHaveBeenCalledWith(2, 10);

    const prevButton = screen.getByRole("button", { name: "Go to previous page" });
    fireEvent.click(prevButton);

    await waitFor(() => {
      expect(screen.getByText("Value 1-1")).toBeInTheDocument();
    });
    expect(fetchData).toHaveBeenCalledWith(1, 10);
  });

  it("handles page size selection changes", async () => {
    const fetchData = jest.fn().mockImplementation((page: number, pageSize: number) => {
      const start = (page - 1) * pageSize;
      return Promise.resolve({
        data: mockRows.slice(start, start + pageSize),
        totalPages: Math.ceil(25 / pageSize),
        totalItems: 25,
      });
    });

    render(
      <PaginatedTable
        headerContent={mockHeaders}
        fetchData={fetchData}
        pageSize={10}
        pageSizeOptions={[10, 25]}
      />
    );

    await waitFor(() => {
      expect(screen.getByText("Value 1-1")).toBeInTheDocument();
    });

    const select = screen.getByLabelText("Rows per page:");
    fireEvent.change(select, { target: { value: "25" } });

    await waitFor(() => {
      expect(fetchData).toHaveBeenCalledWith(1, 25);
    });
    expect(screen.getByText("Showing 1–25 of 25 items")).toBeInTheDocument();
  });

  it("renders empty state when data array is empty", async () => {
    const fetchData = jest.fn().mockResolvedValue({
      data: [],
      totalPages: 1,
      totalItems: 0,
    });

    render(
      <PaginatedTable
        headerContent={mockHeaders}
        fetchData={fetchData}
      />
    );

    await waitFor(() => {
      expect(screen.getByText("No data available")).toBeInTheDocument();
    });
  });

  it("handles error state and retries on button click", async () => {
    const onErrorMock = jest.fn();
    const fetchData = jest
      .fn()
      .mockRejectedValueOnce(new Error("Network connection failed"))
      .mockResolvedValueOnce({
        data: mockRows.slice(0, 10),
        totalPages: 3,
        totalItems: 25,
      });

    render(
      <PaginatedTable
        headerContent={mockHeaders}
        fetchData={fetchData}
        onError={onErrorMock}
      />
    );

    await waitFor(() => {
      expect(screen.getByText("Failed to load data: Network connection failed")).toBeInTheDocument();
    });

    expect(onErrorMock).toHaveBeenCalledWith(expect.any(Error));

    const retryButton = screen.getByRole("button", { name: "Retry" });
    fireEvent.click(retryButton);

    await waitFor(() => {
      expect(screen.getByText("Value 1-1")).toBeInTheDocument();
    });
  });

  it("renders custom loading and empty state components when provided", async () => {
    const fetchData = jest.fn().mockResolvedValue({
      data: [],
      totalPages: 1,
      totalItems: 0,
    });

    render(
      <PaginatedTable
        headerContent={mockHeaders}
        fetchData={fetchData}
        loadingComponent={<div data-testid="custom-loader">Custom Loading...</div>}
        emptyStateComponent={<div data-testid="custom-empty">Custom Empty</div>}
      />
    );

    expect(screen.getByTestId("custom-loader")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByTestId("custom-empty")).toBeInTheDocument();
    });
  });
});

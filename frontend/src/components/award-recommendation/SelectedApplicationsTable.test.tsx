import { render, screen } from "@testing-library/react";
import { identity } from "lodash";
import { mockAwardRecommendationSubmissions } from "src/utils/testing/fixtures";

import SelectedApplicationsTable from "./SelectedApplicationsTable";

jest.mock("next-intl", () => ({
  useTranslations: () => identity,
}));

jest.mock("src/components/core/TableWithResponsiveHeader", () => ({
  TableWithResponsiveHeader: ({
    headerContent,
    tableRowData,
  }: {
    headerContent: Array<{ cellData: React.ReactNode }>;
    tableRowData: Array<Array<{ cellData: React.ReactNode }>>;
  }) => (
    <table data-testid="responsive-table">
      <thead>
        <tr>
          {headerContent.map((header, i) => (
            <th key={i}>{header.cellData}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {tableRowData.map((row, i) => (
          <tr key={i}>
            {row.map((cell, j) => (
              <td key={j}>{cell.cellData}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  ),
}));

describe("SelectedApplicationsTable", () => {
  it("renders submission rows with linked app numbers", () => {
    render(
      <SelectedApplicationsTable
        awardRecommendationId="ar-id-123"
        submissions={mockAwardRecommendationSubmissions}
      />,
    );

    expect(screen.getByTestId("responsive-table")).toBeInTheDocument();
    expect(screen.getByText("columns.appNumber")).toBeInTheDocument();
    expect(screen.getByText("SUB-26-0001")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "SUB-26-0001" })).toHaveAttribute(
      "href",
      "/award-recommendation/ar-id-123/application-submissions/63588df8-f2d1-44ed-a201-5804abba696b/edit",
    );
    expect(screen.getByText("Test project")).toBeInTheDocument();
    expect(screen.getByText("Test Org")).toBeInTheDocument();
  });
});

import { render, screen, waitFor } from "@testing-library/react";
import { identity } from "lodash";
import AwardRecommendationsListTable from "src/app/[locale]/(base)/award-recommendation/_components/AwardRecommendationsListTable";
import {
  mockAwardRecommendationListItem,
  mockAwardRecommendationListItemNoSubmissions,
  mockDraftAwardRecommendationListItem,
} from "src/utils/testing/fixtures";

const mockClientFetch = jest.fn();

jest.mock("next-intl", () => ({
  useTranslations: () => identity,
}));

jest.mock("src/hooks/useClientFetch", () => ({
  useClientFetch: () => ({
    clientFetch: mockClientFetch,
  }),
}));

jest.mock("src/components/core/TableWithResponsiveHeader", () => ({
  TableWithResponsiveHeader: ({
    tableRowData,
  }: {
    tableRowData: { cellData: React.ReactNode }[][];
  }) => (
    <div data-testid="award-recommendations-table">
      {tableRowData.map((row, rowIndex) => (
        <div key={rowIndex} data-testid={`table-row-${rowIndex}`}>
          {row.map((cell, cellIndex) => (
            <div key={cellIndex}>{cell.cellData}</div>
          ))}
        </div>
      ))}
    </div>
  ),
}));

jest.mock(
  "src/components/award-recommendation/AwardRecommendationStatusTag",
  () => ({
    __esModule: true,
    default: ({ status }: { status: string }) => (
      <div data-testid={`status-tag-${status}`} />
    ),
  }),
);

jest.mock("src/components/core/SimplerAlert", () => ({
  __esModule: true,
  default: ({ messageText }: { messageText: string }) => (
    <div data-testid="error-alert">{messageText}</div>
  ),
}));

jest.mock("src/components/core/Spinner", () => ({
  __esModule: true,
  default: () => <div data-testid="spinner" />,
}));

jest.mock("@trussworks/react-uswds", () => ({
  Pagination: () => <div data-testid="pagination" />,
}));

describe("AwardRecommendationsListTable", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockClientFetch.mockResolvedValue({
      data: [mockAwardRecommendationListItem],
      pagination_info: { total_pages: 1, total_records: 1 },
    });
  });

  it("renders award recommendation rows with view link for non-draft status", async () => {
    render(
      <AwardRecommendationsListTable
        currentAgencyId="1"
        onTotalRecordsChange={jest.fn()}
      />,
    );

    await waitFor(() => {
      expect(
        screen.getByRole("link", {
          name: mockAwardRecommendationListItem.award_recommendation_number,
        }),
      ).toHaveAttribute(
        "href",
        `/award-recommendation/${mockAwardRecommendationListItem.award_recommendation_id}`,
      );
    });

    expect(
      screen.getByRole("link", {
        name: mockAwardRecommendationListItem.opportunity.opportunity_title,
      }),
    ).toHaveAttribute(
      "href",
      `/opportunity/${mockAwardRecommendationListItem.opportunity.opportunity_id}`,
    );
    expect(
      screen.getByText(
        mockAwardRecommendationListItem.opportunity.opportunity_number,
      ),
    ).toBeInTheDocument();
    expect(screen.getByText("200")).toBeInTheDocument();
  });

  it("renders zero applications received when summary count is zero", async () => {
    mockClientFetch.mockResolvedValue({
      data: [mockAwardRecommendationListItemNoSubmissions],
      pagination_info: { total_pages: 1, total_records: 1 },
    });

    render(<AwardRecommendationsListTable currentAgencyId="1" />);

    await waitFor(() => {
      expect(
        screen.getByText(
          mockAwardRecommendationListItemNoSubmissions.award_recommendation_number,
        ),
      ).toBeInTheDocument();
    });

    expect(screen.getByText("0")).toBeInTheDocument();
  });

  it("renders edit link for draft award recommendations", async () => {
    mockClientFetch.mockResolvedValue({
      data: [mockDraftAwardRecommendationListItem],
      pagination_info: { total_pages: 1, total_records: 1 },
    });

    render(<AwardRecommendationsListTable currentAgencyId="1" />);

    await waitFor(() => {
      expect(
        screen.getByRole("link", {
          name: mockDraftAwardRecommendationListItem.award_recommendation_number,
        }),
      ).toHaveAttribute(
        "href",
        `/award-recommendation/${mockDraftAwardRecommendationListItem.award_recommendation_id}/edit`,
      );
    });
  });

  it("renders empty state when no award recommendations are returned", async () => {
    mockClientFetch.mockResolvedValue({
      data: [],
      pagination_info: { total_pages: 1, total_records: 0 },
    });

    render(<AwardRecommendationsListTable currentAgencyId="1" />);

    await waitFor(() => {
      expect(screen.getByText("empty")).toBeInTheDocument();
    });
  });

  it("reports total records to the parent callback", async () => {
    const onTotalRecordsChange = jest.fn();

    render(
      <AwardRecommendationsListTable
        currentAgencyId="1"
        onTotalRecordsChange={onTotalRecordsChange}
      />,
    );

    await waitFor(() => {
      expect(onTotalRecordsChange).toHaveBeenCalledWith(1);
    });
  });
});

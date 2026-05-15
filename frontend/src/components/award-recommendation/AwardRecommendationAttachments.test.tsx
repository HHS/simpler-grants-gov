import { render, screen, waitFor } from "@testing-library/react";
import * as useClientFetchModule from "src/hooks/useClientFetch";

import { AwardRecommendationAttachments } from "./AwardRecommendationAttachments";

jest.mock("src/hooks/useClientFetch");

describe("AwardRecommendationAttachments", () => {
  it("renders risks table with data", async () => {
    const mockFetch = jest.fn().mockResolvedValue({
      data: [
        {
          risk_number: 1,
          app_number: "APP-001",
          condition: "Test Condition",
        },
      ],
      pagination_info: { total_pages: 1 },
    });
    (useClientFetchModule.useClientFetch as jest.Mock).mockReturnValue({
      clientFetch: mockFetch,
    });
    render(<AwardRecommendationAttachments awardRecommendationId="test-id" />);
    await waitFor(() =>
      expect(screen.getByText("Test Condition")).toBeInTheDocument(),
    );
    expect(screen.getByText("APP-001")).toBeInTheDocument();
  });

  it("handles fetch error", async () => {
    const mockFetch = jest.fn().mockRejectedValue(new Error("fail"));
    (useClientFetchModule.useClientFetch as jest.Mock).mockReturnValue({
      clientFetch: mockFetch,
    });
    render(<AwardRecommendationAttachments awardRecommendationId="test-id" />);
    await waitFor(() =>
      expect(
        screen.getByText("Specific risks & recommended conditions"),
      ).toBeInTheDocument(),
    );
  });

  describe("AwardRecommendationAttachments - extended", () => {
    it("renders empty state when no risks", async () => {
      const mockFetch = jest
        .fn()
        .mockResolvedValue({ data: [], pagination_info: { total_pages: 1 } });
      (useClientFetchModule.useClientFetch as jest.Mock).mockReturnValue({
        clientFetch: mockFetch,
      });
      render(
        <AwardRecommendationAttachments awardRecommendationId="test-id" />,
      );
      await waitFor(() =>
        expect(
          screen.getByText("Specific risks & recommended conditions"),
        ).toBeInTheDocument(),
      );
      expect(screen.queryByText("Risk 1")).not.toBeInTheDocument();
    });

    it("renders pagination and responds to page change", async () => {
      const mockFetch = jest
        .fn()
        .mockResolvedValueOnce({
          data: [
            {
              risk_number: 1,
              app_number: "APP-001",
              condition: "Condition 1",
            },
          ],
          pagination_info: { total_pages: 2 },
        })
        .mockResolvedValueOnce({
          data: [
            {
              risk_number: 2,
              app_number: "APP-002",
              condition: "Condition 2",
            },
          ],
          pagination_info: { total_pages: 2 },
        });
      (useClientFetchModule.useClientFetch as jest.Mock).mockReturnValue({
        clientFetch: mockFetch,
      });
      render(
        <AwardRecommendationAttachments awardRecommendationId="test-id" />,
      );
      await waitFor(() =>
        expect(screen.getByText("Condition 1")).toBeInTheDocument(),
      );
      const next = screen.getByLabelText("Next page");
      next && next.click();
      await waitFor(() =>
        expect(screen.getByText("Condition 2")).toBeInTheDocument(),
      );
    });

    it("renders delete button and PopoverMenu in edit mode", async () => {
      const mockFetch = jest.fn().mockResolvedValue({
        data: [
          {
            risk_number: 1,
            app_number: "APP-010",
            condition: "Condition A",
          },
        ],
        pagination_info: { total_pages: 1 },
      });
      (useClientFetchModule.useClientFetch as jest.Mock).mockReturnValue({
        clientFetch: mockFetch,
      });
      render(
        <AwardRecommendationAttachments
          awardRecommendationId="test-id"
          mode="edit"
        />,
      );
      await waitFor(() =>
        expect(screen.getByText("Condition A")).toBeInTheDocument(),
      );
      const actionHeaders = screen.getAllByText("Action");
      expect(actionHeaders.length).toBeGreaterThan(0);
      expect(
        screen.getByRole("button", { name: "", hidden: true }),
      ).toBeInTheDocument();
    });
  });
});

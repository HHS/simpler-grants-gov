import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import * as useClientFetchModule from "src/hooks/useClientFetch";

import { AwardRecommendationAttachments } from "./AwardRecommendationAttachments";

jest.mock("src/hooks/useClientFetch");
jest.mock("src/components/Spinner", () => ({
  __esModule: true,
  default: () => <div data-testid="spinner">Loading...</div>,
}));

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
    expect(screen.getByTestId("spinner")).toBeInTheDocument();
    await waitFor(() =>
      expect(screen.getByText("Test Condition")).toBeInTheDocument(),
    );
    expect(screen.getByText("APP-001")).toBeInTheDocument();
    expect(screen.queryByTestId("spinner")).not.toBeInTheDocument();
  });

  it("handles fetch error and displays error alert", async () => {
    const consoleErrorSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});
    const mockFetch = jest.fn().mockRejectedValue(new Error("fail"));
    (useClientFetchModule.useClientFetch as jest.Mock).mockReturnValue({
      clientFetch: mockFetch,
    });
    render(<AwardRecommendationAttachments awardRecommendationId="test-id" />);
    await waitFor(() =>
      expect(
        screen.getByText("Unable to load or update risks. Please try again."),
      ).toBeInTheDocument(),
    );
    expect(screen.queryByTestId("spinner")).not.toBeInTheDocument();
    expect(screen.getByTestId("simpler-alert")).toBeInTheDocument();
    expect(consoleErrorSpy).toHaveBeenCalled();
    consoleErrorSpy.mockRestore();
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
            award_recommendation_risk_id: "risk-123",
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

    it("deletes risk and refetches list", async () => {
      const mockFetch = jest
        .fn()
        .mockResolvedValueOnce({
          data: [
            {
              risk_number: 1,
              app_number: "APP-010",
              condition: "Condition A",
              award_recommendation_risk_id: "risk-123",
            },
          ],
          pagination_info: { total_pages: 1 },
        })
        .mockResolvedValueOnce({ success: true })
        .mockResolvedValueOnce({
          data: [],
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
      const popoverButton = screen.getByRole("button", {
        name: "",
        hidden: true,
      });
      fireEvent.click(popoverButton);
      const deleteButton = await screen.findByText("Delete");
      fireEvent.click(deleteButton);
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          "/api/award-recommendations/test-id/risks/risk-123",
          expect.objectContaining({ method: "DELETE" }),
        );
      });
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledTimes(3);
      });
    });

    it("displays error alert when delete fails", async () => {
      const consoleErrorSpy = jest
        .spyOn(console, "error")
        .mockImplementation(() => {});
      const mockFetch = jest
        .fn()
        .mockResolvedValueOnce({
          data: [
            {
              risk_number: 1,
              app_number: "APP-010",
              condition: "Condition A",
              award_recommendation_risk_id: "risk-123",
            },
          ],
          pagination_info: { total_pages: 1 },
        })
        .mockRejectedValueOnce(new Error("Delete failed"));
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
      const popoverButton = screen.getByRole("button", {
        name: "",
        hidden: true,
      });
      fireEvent.click(popoverButton);
      const deleteButton = await screen.findByText("Delete");
      fireEvent.click(deleteButton);
      await waitFor(() => {
        expect(
          screen.getByText("Unable to load or update risks. Please try again."),
        ).toBeInTheDocument();
      });
      expect(screen.getByTestId("simpler-alert")).toBeInTheDocument();
      expect(consoleErrorSpy).toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
    });
  });
});

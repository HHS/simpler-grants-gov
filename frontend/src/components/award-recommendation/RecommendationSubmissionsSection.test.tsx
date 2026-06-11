import { render, screen, waitFor } from "@testing-library/react";
import { identity } from "lodash";
import { AwardRecommendationSubmission } from "src/types/awardRecommendationTypes";

import { RecommendationSubmissionsSection } from "./RecommendationSubmissionsSection";

const mockClientFetch = jest.fn();

jest.mock("next-intl", () => ({
  useTranslations: () => identity,
}));

jest.mock("src/hooks/useClientFetch", () => ({
  useClientFetch: () => ({
    clientFetch: mockClientFetch,
  }),
}));

jest.mock("src/components/core/Spinner", () => ({
  __esModule: true,
  default: () => <div data-testid="spinner">Loading</div>,
}));

const mockSubmission: AwardRecommendationSubmission = {
  award_recommendation_application_submission_id:
    "63588df8-f2d1-44ed-a201-5804abba696b",
  application_submission: {
    application_submission_id: "63588df8-f2d1-44ed-a201-5804abba696c",
    application_submission_number: "APP-26-00001",
    project_title: "Test project",
    total_requested_amount: "50000.00",
    application: {
      application_id: "63588df8-f2d1-44ed-a201-5804abba696d",
      competition_id: "63588df8-f2d1-44ed-a201-5804abba696e",
      organization: {
        organization_id: "63588df8-f2d1-44ed-a201-5804abba696f",
        organization_name: "Test Org",
        uei: "UEI000001",
      },
    },
  },
  submission_detail: {
    award_recommendation_type: "recommended_for_funding",
    recommended_amount: "50000.00",
    scoring_comment: "85",
    has_exception: false,
  },
};

describe("RecommendationSubmissionsSection", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders edit CTA in edit mode when no recommended submissions exist", async () => {
    mockClientFetch.mockResolvedValue({
      pagination_info: { total_records: 0, total_pages: 0 },
    });

    render(
      <RecommendationSubmissionsSection
        awardRecommendationId="test-id"
        viewMode={false}
      />,
    );

    await waitFor(() => {
      expect(screen.queryByTestId("spinner")).not.toBeInTheDocument();
    });

    expect(screen.getByText("recommendedAwards.heading")).toBeInTheDocument();
    expect(screen.getByText("recommendedAwards.editLink")).toBeInTheDocument();
    expect(screen.queryByText("APP-26-00001")).not.toBeInTheDocument();
  });

  it("renders table with edit link in edit mode when recommended submissions exist", async () => {
    mockClientFetch.mockImplementation(
      (_url: string, options?: RequestInit) => {
        const body = JSON.parse((options?.body as string) || "{}") as {
          filters?: { award_recommendation_type?: { one_of: string[] } };
          pagination?: { page_size?: number };
        };

        if (body.filters?.award_recommendation_type) {
          if (body.pagination?.page_size === 1) {
            return { pagination_info: { total_records: 1, total_pages: 1 } };
          }

          return {
            data: [mockSubmission],
            pagination_info: { total_records: 1, total_pages: 1 },
          };
        }

        return { pagination_info: { total_records: 0, total_pages: 0 } };
      },
    );

    render(
      <RecommendationSubmissionsSection
        awardRecommendationId="test-id"
        viewMode={false}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText("APP-26-00001")).toBeInTheDocument();
    });

    expect(screen.getByText("recommendedAwards.heading")).toBeInTheDocument();
    expect(screen.getByText("recommendedAwards.editLink")).toBeInTheDocument();
    expect(screen.getByText("Test project")).toBeInTheDocument();
  });

  it("renders exceptions table in edit mode when exception submissions exist", async () => {
    mockClientFetch.mockImplementation(
      (_url: string, options?: RequestInit) => {
        const body = JSON.parse((options?.body as string) || "{}") as {
          filters?: {
            award_recommendation_type?: { one_of: string[] };
            has_exception?: { one_of: boolean[] };
          };
          pagination?: { page_size?: number };
        };

        if (body.filters?.award_recommendation_type) {
          return { pagination_info: { total_records: 0, total_pages: 0 } };
        }

        if (body.filters?.has_exception) {
          if (body.pagination?.page_size === 1) {
            return { pagination_info: { total_records: 1, total_pages: 1 } };
          }

          return {
            data: [
              {
                ...mockSubmission,
                submission_detail: {
                  ...mockSubmission.submission_detail,
                  award_recommendation_type: "not_recommended",
                  has_exception: true,
                },
              },
            ],
            pagination_info: { total_records: 1, total_pages: 1 },
          };
        }

        return { pagination_info: { total_records: 0, total_pages: 0 } };
      },
    );

    render(
      <RecommendationSubmissionsSection
        awardRecommendationId="test-id"
        viewMode={false}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText("exceptions.heading")).toBeInTheDocument();
      expect(screen.getByText("APP-26-00001")).toBeInTheDocument();
    });

    expect(screen.getByText("recommendedAwards.editLink")).toBeInTheDocument();
  });

  it("renders recommended table in view mode when recommended submissions exist", async () => {
    mockClientFetch.mockImplementation(
      (_url: string, options?: RequestInit) => {
        const body = JSON.parse((options?.body as string) || "{}") as {
          filters?: { award_recommendation_type?: { one_of: string[] } };
          pagination?: { page_size?: number };
        };

        if (body.filters?.award_recommendation_type) {
          if (body.pagination?.page_size === 1) {
            return { pagination_info: { total_records: 1, total_pages: 1 } };
          }

          return {
            data: [mockSubmission],
            pagination_info: { total_records: 1, total_pages: 1 },
          };
        }

        return { pagination_info: { total_records: 0, total_pages: 0 } };
      },
    );

    render(
      <RecommendationSubmissionsSection
        awardRecommendationId="test-id"
        viewMode={true}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText("APP-26-00001")).toBeInTheDocument();
    });

    expect(screen.getByText("Test project")).toBeInTheDocument();
    expect(screen.getByText("Test Org")).toBeInTheDocument();
    expect(screen.getByText("UEI000001")).toBeInTheDocument();
    expect(screen.getByText("85")).toBeInTheDocument();
    expect(screen.getByText("recommended")).toBeInTheDocument();
    expect(screen.queryByText("exceptions.heading")).not.toBeInTheDocument();
  });

  it("renders exceptions table when exception submissions exist", async () => {
    mockClientFetch.mockImplementation(
      (_url: string, options?: RequestInit) => {
        const body = JSON.parse((options?.body as string) || "{}") as {
          filters?: {
            award_recommendation_type?: { one_of: string[] };
            has_exception?: { one_of: boolean[] };
          };
          pagination?: { page_size?: number };
        };

        if (body.filters?.award_recommendation_type) {
          return { pagination_info: { total_records: 0, total_pages: 0 } };
        }

        if (body.filters?.has_exception) {
          if (body.pagination?.page_size === 1) {
            return { pagination_info: { total_records: 1, total_pages: 1 } };
          }

          return {
            data: [
              {
                ...mockSubmission,
                submission_detail: {
                  ...mockSubmission.submission_detail,
                  award_recommendation_type: "not_recommended",
                  has_exception: true,
                },
              },
            ],
            pagination_info: { total_records: 1, total_pages: 1 },
          };
        }

        return { pagination_info: { total_records: 0, total_pages: 0 } };
      },
    );

    render(
      <RecommendationSubmissionsSection
        awardRecommendationId="test-id"
        viewMode={true}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText("exceptions.heading")).toBeInTheDocument();
    });
  });

  it("renders nothing in view mode when no submissions match filters", async () => {
    mockClientFetch.mockResolvedValue({
      pagination_info: { total_records: 0, total_pages: 0 },
    });

    const { container } = render(
      <RecommendationSubmissionsSection
        awardRecommendationId="test-id"
        viewMode={true}
      />,
    );

    await waitFor(() => {
      expect(screen.queryByTestId("spinner")).not.toBeInTheDocument();
    });

    expect(container).toBeEmptyDOMElement();
  });
});

import { render, screen, waitFor } from "@testing-library/react";
import { axe } from "jest-axe";
import { identity } from "lodash";
import Applications from "src/app/[locale]/(base)/workspace/applications/page";
import {
  ApplicationDetail,
  ApplicationStatus,
} from "src/types/applicationResponseTypes";
import { DeepPartial } from "src/utils/testing/commonTestUtils";
import { localeParams } from "src/utils/testing/intlMocks";

import { ReactElement } from "react";

import { PaginatedTableProps } from "src/components/core/paginatedTable/PaginatedTable";
import { TableWithResponsiveHeader } from "src/components/core/TableWithResponsiveHeader";

jest.mock("react", () => ({
  ...jest.requireActual<typeof import("react")>("react"),
  use: jest.fn(() => ({
    locale: "en",
  })),
}));

jest.mock("next-intl/server", () => ({
  getTranslations: () => identity,
  setRequestLocale: identity,
}));

const mockFetchApplicationsPage = jest.fn();

jest.mock("src/services/fetch/fetchers/userApplicationsFetcher", () => ({
  fetchApplicationsPage: (...args: unknown[]) =>
    mockFetchApplicationsPage(...args) as unknown,
}));

const mockBreadcrumbs = jest.fn();

jest.mock("src/components/core/Breadcrumbs", () => ({
  __esModule: true,
  default: (props: { breadcrumbList: { title: string; path: string }[] }) => {
    mockBreadcrumbs(props);
    return <nav data-testid="mock-breadcrumbs" />;
  },
}));

// PaginatedTable has its own tests, here we verify how the page configures it
const mockPaginatedTable = jest.fn();

jest.mock("src/components/core/paginatedTable/PaginatedTable", () => ({
  PaginatedTable: (props: PaginatedTableProps<ApplicationDetail>) => {
    mockPaginatedTable(props);
    return <div data-testid="mock-paginated-table" />;
  },
}));

const renderPage = async (searchParams?: Record<string, string | string[]>) => {
  const component = await Applications({
    params: localeParams,
    searchParams: searchParams ? Promise.resolve(searchParams) : undefined,
  });
  return render(component);
};

const tableProps = () => {
  const calls = mockPaginatedTable.mock.calls as [
    PaginatedTableProps<ApplicationDetail>,
  ][];
  return calls[0][0];
};

const renderRow = (application: DeepPartial<ApplicationDetail>) => {
  const { headerContent, mapRowData } = tableProps();
  return render(
    <TableWithResponsiveHeader
      headerContent={headerContent}
      tableRowData={[mapRowData(application as ApplicationDetail, 0)]}
    />,
  );
};

describe("Applications", () => {
  let basicApplication: DeepPartial<ApplicationDetail>;

  beforeEach(() => {
    jest.clearAllMocks();
    basicApplication = {
      application_id: "1a4d247b-ca08-4855-bdcd-e48432cd6d71",
      application_name: "first!!!",
      application_status: ApplicationStatus.IN_PROGRESS,
      competition: {
        closing_date: "2025-11-11",
        competition_id: "642a4dda-8c13-4bc6-bbae-1a0d133d90a6",
        competition_title: "Truth common can board.",
        is_open: true,
        opening_date: "2025-10-26",
        opportunity: {
          agency_name: "Health Resources and Services Administration",
          opportunity_id: "c9e472ab-2561-4ac3-b514-63781bc6a404",
          opportunity_title: "Local Pilot-equivalent Opportunity",
        },
      },
    };
  });

  it("passes the correct breadcrumbs", async () => {
    await renderPage();

    expect(screen.getByTestId("mock-breadcrumbs")).toBeInTheDocument();
    expect(mockBreadcrumbs).toHaveBeenCalledWith({
      breadcrumbList: [
        {
          title: "breadcrumbWorkspace",
          path: "/workspace",
        },
        {
          title: "breadcrumbApplications",
        },
      ],
    });
  });

  it("renders the page heading and the paginated table", async () => {
    await renderPage();
    expect(
      screen.getByRole("heading", { level: 1, name: "pageHeading" }),
    ).toBeVisible();
    expect(screen.getByTestId("mock-paginated-table")).toBeInTheDocument();
  });

  it("passes accessibility scan", async () => {
    const { container } = await renderPage();
    const results = await waitFor(() => axe(container));
    expect(results).toHaveNoViolations();
  });

  describe("pagination", () => {
    it("starts on page 1 when no page param is present", async () => {
      await renderPage();
      expect(tableProps().page).toBe(1);
    });

    it("starts on page 1 when search params are empty", async () => {
      await renderPage({});
      expect(tableProps().page).toBe(1);
    });

    it("respects the page param", async () => {
      await renderPage({ page: "4" });
      expect(tableProps().page).toBe(4);
    });

    it.each(["0", "-1", "abc", "1.5"])(
      "falls back to page 1 for invalid page param %p",
      async (page) => {
        await renderPage({ page });
        expect(tableProps().page).toBe(1);
      },
    );

    it("fetches pages of the user's applications", async () => {
      await renderPage();
      mockFetchApplicationsPage.mockResolvedValue({ data: [] });
      await tableProps().fetchPage(3);
      expect(mockFetchApplicationsPage).toHaveBeenCalledWith(3);
    });

    it("keys rows by application id", async () => {
      await renderPage();
      expect(
        tableProps().getRowKey?.(basicApplication as ApplicationDetail),
      ).toBe("1a4d247b-ca08-4855-bdcd-e48432cd6d71");
    });
  });

  describe("no applications have been started", () => {
    it("renders the no applications message as the empty state", async () => {
      await renderPage();
      render(<>{tableProps().emptyMessage}</>);

      expect(screen.getByText("primary")).toBeVisible();
      expect(screen.getByText("secondary")).toBeVisible();
    });
  });

  describe("there was an error fetching applications", () => {
    it("passes the error message to the table", async () => {
      await renderPage();
      expect(tableProps().errorMessage).toBe("Applications.errorMessage");
    });
  });

  describe("summary", () => {
    it("renders the total number of applications across all pages", async () => {
      await renderPage();
      const summary = tableProps().renderSummary?.({
        page_offset: 1,
        total_pages: 3,
        total_records: 52,
      }) as ReactElement;
      render(summary);
      expect(screen.getByText("Applications.numApplications")).toBeVisible();
    });
  });

  describe("an application is returned", () => {
    it("renders headings", async () => {
      await renderPage();
      renderRow(basicApplication);

      ["closeDate", "status", "applicationName", "type", "opportunity"].forEach(
        (heading) => {
          expect(
            screen.getAllByText(`Applications.tableHeadings.${heading}`),
          ).toHaveLength(2);
        },
      );
    });

    it("renders close date", async () => {
      await renderPage();
      renderRow(basicApplication);
      expect(screen.getByText("November 11, 2025")).toBeVisible();
    });

    it("renders application filing name as a link", async () => {
      await renderPage();
      renderRow(basicApplication);
      expect(screen.getByRole("link", { name: "first!!!" })).toHaveAttribute(
        "href",
        "/workspace/applications/1a4d247b-ca08-4855-bdcd-e48432cd6d71",
      );
    });

    it("renders opportunity name and agency", async () => {
      await renderPage();
      renderRow(basicApplication);
      expect(
        screen.getByText("Local Pilot-equivalent Opportunity"),
      ).toBeVisible();
      expect(
        screen.getByText("Health Resources and Services Administration"),
      ).toBeVisible();
    });

    it("passes accessibility scan", async () => {
      await renderPage();
      const { container } = renderRow(basicApplication);
      const results = await waitFor(() => axe(container));
      expect(results).toHaveNoViolations();
    });

    describe("renders status", () => {
      it("if in draft", async () => {
        await renderPage();
        renderRow(basicApplication);
        expect(
          screen.getByText("Applications.tableContents.draft"),
        ).toBeVisible();
      });

      it("if submitted", async () => {
        await renderPage();
        renderRow({
          ...basicApplication,
          application_status: ApplicationStatus.SUBMITTED,
        });
        expect(
          screen.getByText("Applications.tableContents.submitted"),
        ).toBeVisible();
      });

      it("if approved", async () => {
        await renderPage();
        renderRow({
          ...basicApplication,
          application_status: ApplicationStatus.ACCEPTED,
        });
        expect(
          screen.getByText("Applications.tableContents.submitted"),
        ).toBeVisible();
      });
    });

    describe("renders type", () => {
      it("if started as an individual", async () => {
        await renderPage();
        renderRow(basicApplication);
        expect(
          screen.getByText("Applications.tableContents.individual"),
        ).toBeVisible();
      });

      it("if started as an organization", async () => {
        await renderPage();
        renderRow({
          ...basicApplication,
          organization: {
            sam_gov_entity: { legal_business_name: "Great Organization" },
          },
        });
        expect(screen.getByText("Great Organization")).toBeVisible();
      });
    });
  });
});

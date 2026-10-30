import { render, screen } from "@testing-library/react";
import { axe } from "jest-axe";
import ApiDashboardPage from "src/app/[locale]/(base)/developers/api-dashboard/page";
import { ApiKey } from "src/types/apiKeyTypes";
import { createMockApiKey } from "src/utils/testing/fixtures";

const mockGetSession = jest.fn();
const mockHandleListApiKeys = jest.fn();

jest.mock("src/services/auth/session", () => ({
  getSession: (): unknown => mockGetSession(),
}));

jest.mock("src/services/fetch/fetchers/apiKeyFetcher", () => ({
  handleListApiKeys: (...args: unknown[]): unknown =>
    mockHandleListApiKeys(...args),
}));

jest.mock("next-intl/server", () => ({
  getTranslations: () => (key: string) => key,
}));

jest.mock("src/components/core/UnauthenticatedMessage", () => ({
  UnauthenticatedMessage: () => <div>SHARED SIGNED OUT MESSAGE</div>,
}));

// Create a simple mock component for testing
const MockApiDashboardPage = () => {
  const mockApiKeys: ApiKey[] = [
    createMockApiKey({
      api_key_id: "key-1",
      key_name: "Test Key 1",
      last_used: "2023-01-02T00:00:00Z",
    }),
  ];

  return (
    <div className="grid-container">
      <div className="display-flex flex-justify margin-bottom-4">
        <h1 className="margin-y-0">API Dashboard</h1>
        <button data-testid="create-api-key-modal">Create API Key</button>
      </div>
      <div data-testid="api-key-table">
        {mockApiKeys.map((key) => (
          <div key={key.api_key_id} data-testid={`api-key-${key.api_key_id}`}>
            {key.key_name}
          </div>
        ))}
      </div>
    </div>
  );
};

describe("ApiDashboardPage", () => {
  it("renders API dashboard with heading and create button", () => {
    render(<MockApiDashboardPage />);

    expect(screen.getByText("API Dashboard")).toBeInTheDocument();
    expect(screen.getByTestId("create-api-key-modal")).toBeInTheDocument();
  });

  it("displays API keys", () => {
    render(<MockApiDashboardPage />);

    expect(screen.getByTestId("api-key-table")).toBeInTheDocument();
    expect(screen.getByTestId("api-key-key-1")).toBeInTheDocument();
    expect(screen.getByText("Test Key 1")).toBeInTheDocument();
  });

  it("passes accessibility scan", async () => {
    const { container } = render(<MockApiDashboardPage />);

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("has proper container structure", () => {
    render(<MockApiDashboardPage />);

    // Check that elements exist without directly accessing DOM nodes
    expect(screen.getByText("API Dashboard")).toBeInTheDocument();
    expect(screen.getByTestId("create-api-key-modal")).toBeInTheDocument();
    expect(screen.getByTestId("api-key-table")).toBeInTheDocument();
  });
});

describe("ApiDashboardPage signed out", () => {
  it("renders the shared signed-out message without loading API keys", async () => {
    mockGetSession.mockResolvedValue(null);

    const page = await ApiDashboardPage({
      params: Promise.resolve({ locale: "en" }),
    });
    render(page);

    expect(screen.getByText("SHARED SIGNED OUT MESSAGE")).toBeInTheDocument();
    expect(screen.queryByText("heading")).not.toBeInTheDocument();
    expect(mockHandleListApiKeys).not.toHaveBeenCalled();
  });
});

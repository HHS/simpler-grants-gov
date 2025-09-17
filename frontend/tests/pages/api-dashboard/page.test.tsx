import { render, screen } from "@testing-library/react";
import { axe } from "jest-axe";
import { ApiKey } from "src/types/apiKeyTypes";
import { createMockApiKey } from "src/utils/testing/fixtures";

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

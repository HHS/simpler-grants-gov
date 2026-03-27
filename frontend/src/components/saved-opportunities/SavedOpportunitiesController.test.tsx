import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { Organization } from "src/types/applicationResponseTypes";
import { BaseOpportunity } from "src/types/opportunity/opportunityResponseTypes";
import { createMockOpportunity } from "src/utils/testing/fixtures";

import { SavedOpportunitiesController } from "./SavedOpportunitiesController";

const mockClientFetch = jest.fn<
  Promise<unknown>,
  [string, RequestInit | undefined]
>();

interface MockSearchResultsListItemProps {
  opportunity: BaseOpportunity;
  onShareClick?: (buttonElement: HTMLButtonElement) => void;
}

interface MockShareOpportunityToOrganizationsModalProps {
  onSavedOrganizationsChange: (organizationIds: Set<string>) => void;
}

interface MockShareOpportunityToOrganizationsModalProps {
  onSavedOrganizationsChange: (organizationIds: Set<string>) => void;
  organizations: Organization[];
}

jest.mock("src/hooks/useClientFetch", () => ({
  useClientFetch: () => ({
    clientFetch: mockClientFetch,
  }),
}));

jest.mock("src/components/search/SearchResultsListItem", () => ({
  __esModule: true,
  default: ({ opportunity, onShareClick }: MockSearchResultsListItemProps) => (
    <div>
      <div data-testid={`organizations-${opportunity.opportunity_id}`}>
        {JSON.stringify(opportunity.saved_to_organizations ?? [])}
      </div>
      <button
        type="button"
        onClick={(event) =>
          onShareClick?.(event.currentTarget as HTMLButtonElement)
        }
      >
        Open share modal
      </button>
    </div>
  ),
}));

jest.mock(
  "src/components/shareOpportunityToOrganizations/ShareOpportunityToOrganizationsModal",
  () => ({
    __esModule: true,
    ShareOpportunityToOrganizationsModal: ({
      onSavedOrganizationsChange,
      organizations,
    }: MockShareOpportunityToOrganizationsModalProps) => (
      <div>
        <div data-testid="modal-organizations">
          {organizations
            .map((organization) => organization.organization_id)
            .join(",")}
        </div>
        <button
          type="button"
          onClick={() =>
            onSavedOrganizationsChange(new Set(["organization-1"]))
          }
        >
          Save organizations
        </button>
      </div>
    ),
  }),
);

describe("SavedOpportunitiesController", () => {
  beforeEach(() => {
    mockClientFetch.mockReset();
  });

  it("maps organization names into saved_to_organizations after modal updates", async () => {
    const opportunity = createMockOpportunity();

    const organizations: Organization[] = [
      {
        organization_id: "organization-1",
        sam_gov_entity: {
          ebiz_poc_email: "test@example.com",
          ebiz_poc_first_name: "Test",
          ebiz_poc_last_name: "User",
          expiration_date: "2026-12-31",
          legal_business_name: "Alpha Coalition",
          uei: "ABC123456789",
        },
      },
    ];

    mockClientFetch.mockResolvedValueOnce(organizations);

    render(<SavedOpportunitiesController opportunities={[opportunity]} />);

    await waitFor(() => {
      expect(screen.getByTestId("modal-organizations")).toHaveTextContent(
        "organization-1",
      );
    });

    fireEvent.click(screen.getByRole("button", { name: "Open share modal" }));
    fireEvent.click(screen.getByRole("button", { name: "Save organizations" }));

    await waitFor(() => {
      expect(
        screen.getByTestId(`organizations-${opportunity.opportunity_id}`),
      ).toHaveTextContent("Alpha Coalition");
    });
  });
});

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { Organization } from "src/types/applicationResponseTypes";
import { BaseOpportunity } from "src/types/opportunity/opportunityResponseTypes";
import { createMockOpportunity } from "src/utils/testing/fixtures";

import { SavedOpportunitiesController } from "./SavedOpportunitiesController";

interface MockSearchResultsListItemProps {
  opportunity: BaseOpportunity;
  showShareButton?: boolean;
  onShareClick?: (buttonElement: HTMLButtonElement) => void;
}

interface MockShareOpportunityToOrganizationsModalProps {
  onSavedOrganizationsChange: (organizationIds: Set<string>) => void;
  organizations: Organization[];
}

jest.mock("src/components/search/SearchResultsListItem", () => ({
  __esModule: true,
  default: ({
    opportunity,
    showShareButton,
    onShareClick,
  }: MockSearchResultsListItemProps) => (
    <div>
      <div data-testid={`organizations-${opportunity.opportunity_id}`}>
        {JSON.stringify(opportunity.saved_to_organizations ?? [])}
      </div>

      <div data-testid={`show-share-button-${opportunity.opportunity_id}`}>
        {String(showShareButton)}
      </div>

      {showShareButton ? (
        <button
          type="button"
          onClick={(event) =>
            onShareClick?.(event.currentTarget as HTMLButtonElement)
          }
        >
          Open share modal
        </button>
      ) : null}
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
  it("passes showShareButton as false when the user has no organizations", async () => {
    const opportunity = createMockOpportunity();

    render(
      <SavedOpportunitiesController
        opportunities={[opportunity]}
        organizations={[]}
      />,
    );

    await waitFor(() => {
      expect(
        screen.getByTestId(`show-share-button-${opportunity.opportunity_id}`),
      ).toHaveTextContent("false");
    });

    expect(
      screen.queryByRole("button", { name: "Open share modal" }),
    ).not.toBeInTheDocument();
  });

  it("passes showShareButton as true when the user has at least one organization", async () => {
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

    render(
      <SavedOpportunitiesController
        opportunities={[opportunity]}
        organizations={organizations}
      />,
    );

    await waitFor(() => {
      expect(
        screen.getByTestId(`show-share-button-${opportunity.opportunity_id}`),
      ).toHaveTextContent("true");
    });

    expect(
      screen.getByRole("button", { name: "Open share modal" }),
    ).toBeInTheDocument();
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

    render(
      <SavedOpportunitiesController
        opportunities={[opportunity]}
        organizations={organizations}
      />,
    );

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

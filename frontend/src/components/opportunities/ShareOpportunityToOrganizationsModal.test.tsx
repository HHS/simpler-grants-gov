import { render, screen } from "@testing-library/react";
import { Organization } from "src/types/applicationResponseTypes";

import { RefObject } from "react";
import { ModalRef } from "@trussworks/react-uswds";

import { ShareOpportunityToOrganizationsModal } from "src/components/opportunities/ShareOpportunityToOrganizationsModal";

const modalRef: RefObject<ModalRef | null> = { current: null };

const mockOrganizations: Organization[] = [
  {
    organization_id: "org-1",
    sam_gov_entity: {
      legal_business_name: "First Organization",
      uei: "UEI000001",
      expiration_date: "2026-01-01",
      ebiz_poc_email: "poc@first.org",
      ebiz_poc_first_name: "Alice",
      ebiz_poc_last_name: "Smith",
    },
  },
  {
    organization_id: "org-2",
    sam_gov_entity: {
      legal_business_name: "Second Organization",
      uei: "UEI000002",
      expiration_date: "2026-01-01",
      ebiz_poc_email: "poc@second.org",
      ebiz_poc_first_name: "Bob",
      ebiz_poc_last_name: "Jones",
    },
  },
];

describe("ShareOpportunityToOrganizationsModal", () => {
  it("renders the modal title", () => {
    render(
      <ShareOpportunityToOrganizationsModal
        modalRef={modalRef}
        organizations={[]}
        savedToOrganizationIds={new Set<string>()}
        isLoadingOrganizations={false}
        hasOrganizationsError={false}
        opportunityTitle={null}
      />,
    );

    expect(
      screen.getByText("Share this opportunity with an organization"),
    ).toBeInTheDocument();
  });

  it("renders error state when organizations fail to load", () => {
    render(
      <ShareOpportunityToOrganizationsModal
        modalRef={modalRef}
        organizations={[]}
        savedToOrganizationIds={new Set<string>()}
        isLoadingOrganizations={false}
        hasOrganizationsError={true}
        opportunityTitle={null}
      />,
    );

    expect(
      screen.getByText(
        "Could not load your organizations. Please try again later.",
      ),
    ).toBeInTheDocument();
  });

  it("renders loading state", () => {
    render(
      <ShareOpportunityToOrganizationsModal
        modalRef={modalRef}
        organizations={[]}
        savedToOrganizationIds={new Set<string>()}
        isLoadingOrganizations={true}
        hasOrganizationsError={false}
        opportunityTitle={null}
      />,
    );

    expect(screen.getByText("Loading organizations…")).toBeInTheDocument();
  });

  it("renders empty state when user has no organizations", () => {
    render(
      <ShareOpportunityToOrganizationsModal
        modalRef={modalRef}
        organizations={[]}
        savedToOrganizationIds={new Set<string>()}
        isLoadingOrganizations={false}
        hasOrganizationsError={false}
        opportunityTitle={null}
      />,
    );

    expect(
      screen.getByText("You are not a member of any organizations."),
    ).toBeInTheDocument();
  });

  it("renders organizations as disabled checkboxes with correct checked state", () => {
    render(
      <ShareOpportunityToOrganizationsModal
        modalRef={modalRef}
        organizations={mockOrganizations}
        savedToOrganizationIds={new Set<string>(["org-1"])}
        isLoadingOrganizations={false}
        hasOrganizationsError={false}
        opportunityTitle={null}
      />,
    );

    const firstCheckbox = screen.getByRole("checkbox", {
      name: "First Organization",
    });
    const secondCheckbox = screen.getByRole("checkbox", {
      name: "Second Organization",
    });

    expect(firstCheckbox).toBeChecked();
    expect(secondCheckbox).not.toBeChecked();

    expect(firstCheckbox).toBeDisabled();
    expect(secondCheckbox).toBeDisabled();
  });

  it("renders the selected opportunity title when provided", () => {
    render(
      <ShareOpportunityToOrganizationsModal
        modalRef={modalRef}
        organizations={[]}
        savedToOrganizationIds={new Set<string>()}
        isLoadingOrganizations={false}
        hasOrganizationsError={false}
        opportunityTitle={"A Great Opportunity"}
      />,
    );

    expect(screen.getByText("A Great Opportunity")).toBeInTheDocument();
  });
});

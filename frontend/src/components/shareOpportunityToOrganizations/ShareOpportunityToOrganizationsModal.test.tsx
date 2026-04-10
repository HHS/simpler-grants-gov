import { render, screen } from "@testing-library/react";
import { Organization } from "src/types/applicationResponseTypes";
import { BaseOpportunity } from "src/types/opportunity/opportunityResponseTypes";
import { useTranslationsMock } from "src/utils/testing/intlMocks";

import type { RefObject } from "react";
import { ModalRef } from "@trussworks/react-uswds";

import { ShareOpportunityToOrganizationsModal } from "src/components/shareOpportunityToOrganizations/ShareOpportunityToOrganizationsModal";

jest.mock("next-intl", () => ({
  useTranslations: () => useTranslationsMock(),
}));

jest.mock("src/components/shareOpportunityToOrganizations/actions", () => ({
  saveOpportunityForOrganizationAction: jest.fn(),
  deleteSavedOpportunityForOrganizationAction: jest.fn(),
}));

const modalRef: RefObject<ModalRef | null> = { current: null };
const organizations: Organization[] = [
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
];
describe("ShareOpportunityToOrganizationsModal", () => {
  it("renders error state when organizations fail to load", () => {
    render(
      <ShareOpportunityToOrganizationsModal
        modalRef={modalRef}
        organizations={organizations}
        savedToOrganizationIds={new Set<string>()}
        hasOrganizationsError={true}
        selectedOpportunity={null}
        onSavedOrganizationsChange={jest.fn()}
      />,
    );

    expect(screen.getByText("modal.error")).toBeInTheDocument();
  });

  it("renders empty state when user has no organizations", () => {
    render(
      <ShareOpportunityToOrganizationsModal
        modalRef={modalRef}
        organizations={[]}
        savedToOrganizationIds={new Set<string>()}
        hasOrganizationsError={false}
        selectedOpportunity={null}
        onSavedOrganizationsChange={jest.fn()}
      />,
    );

    expect(screen.getByText("modal.fallbackError")).toBeInTheDocument();
  });

  it("renders the selected opportunity title when provided", () => {
    const selectedOpportunity = {
      opportunity_id: "opportunity-1",
      opportunity_title: "A Great Opportunity",
      saved_to_organizations: [],
    } as unknown as BaseOpportunity;

    render(
      <ShareOpportunityToOrganizationsModal
        modalRef={modalRef}
        organizations={organizations}
        savedToOrganizationIds={new Set<string>()}
        hasOrganizationsError={false}
        selectedOpportunity={selectedOpportunity}
        onSavedOrganizationsChange={jest.fn()}
      />,
    );

    expect(screen.getByText(/A Great Opportunity/)).toBeInTheDocument();
    expect(screen.getByLabelText("First Organization")).toBeInTheDocument();
  });

  it("renders the checkbox on the modal", () => {
    const selectedOpportunity = {
      opportunity_id: "opportunity-2",
      opportunity_title: "A Great Opportunity2",
      saved_to_organizations: [],
    } as unknown as BaseOpportunity;

    render(
      <ShareOpportunityToOrganizationsModal
        modalRef={modalRef}
        organizations={organizations}
        savedToOrganizationIds={new Set<string>()}
        hasOrganizationsError={false}
        selectedOpportunity={selectedOpportunity}
        onSavedOrganizationsChange={jest.fn()}
      />,
    );

    expect(screen.getByText(/A Great Opportunity2/)).toBeInTheDocument();
    expect(screen.getByTestId("checkbox")).toBeInTheDocument();
    expect(
      screen.getByText("Which organization should see this?"),
    ).toBeInTheDocument();
  });

  it("renders the checkbox as not checked when the organization is not saved", () => {
    const selectedOpportunity = {
      opportunity_id: "opportunity-3",
      opportunity_title: "A Great Opportunity3",
      saved_to_organizations: [],
    } as unknown as BaseOpportunity;

    render(
      <ShareOpportunityToOrganizationsModal
        modalRef={modalRef}
        organizations={organizations}
        savedToOrganizationIds={new Set<string>()}
        hasOrganizationsError={false}
        selectedOpportunity={selectedOpportunity}
        onSavedOrganizationsChange={jest.fn()}
      />,
    );

    expect(screen.getByText(/A Great Opportunity3/)).toBeInTheDocument();
    const organizationCheckbox = screen.getByRole("checkbox");
    expect(screen.getByTestId("checkbox")).toBeInTheDocument();
    expect(organizationCheckbox).not.toBeChecked();
  });

  it("renders the organization checkbox label", () => {
    const selectedOpportunity = {
      opportunity_id: "opportunity-4",
      opportunity_title: "A Great Opportunity4",
      saved_to_organizations: [],
    } as unknown as BaseOpportunity;

    render(
      <ShareOpportunityToOrganizationsModal
        modalRef={modalRef}
        organizations={organizations}
        savedToOrganizationIds={new Set<string>()}
        hasOrganizationsError={false}
        selectedOpportunity={selectedOpportunity}
        onSavedOrganizationsChange={jest.fn()}
      />,
    );

    expect(screen.getByText(/A Great Opportunity4/)).toBeInTheDocument();
    expect(screen.getByLabelText("First Organization")).toBeInTheDocument();
  });
});

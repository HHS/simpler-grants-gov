import { render, screen } from "@testing-library/react";
import { Organization } from "src/types/applicationResponseTypes";
import { useTranslationsMock } from "src/utils/testing/intlMocks";

import type { RefObject } from "react";
import { ModalRef } from "@trussworks/react-uswds";

import { ShareOpportunityToOrganizationsModal } from "src/components/opportunities/ShareOpportunityToOrganizationsModal";

jest.mock("next-intl", () => ({
  useTranslations: () => useTranslationsMock(),
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
        isLoadingOrganizations={false}
        hasOrganizationsError={true}
        opportunityTitle={null}
      />,
    );

    expect(screen.getByText("modal.error")).toBeInTheDocument();
  });

  it("renders loading state", () => {
    render(
      <ShareOpportunityToOrganizationsModal
        modalRef={modalRef}
        organizations={organizations}
        savedToOrganizationIds={new Set<string>()}
        isLoadingOrganizations={true}
        hasOrganizationsError={false}
        opportunityTitle={null}
      />,
    );

    expect(screen.getByText("modal.loadingOrganizations")).toBeInTheDocument();
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

    expect(screen.getByText("modal.fallbackError")).toBeInTheDocument();
  });

  it("renders the selected opportunity title when provided", () => {
    render(
      <ShareOpportunityToOrganizationsModal
        modalRef={modalRef}
        organizations={[]}
        savedToOrganizationIds={new Set<string>()}
        isLoadingOrganizations={false}
        hasOrganizationsError={false}
        opportunityTitle="A Great Opportunity"
      />,
    );

    expect(
      screen.getByText((content) => content.includes("A Great Opportunity")),
    ).toBeInTheDocument();
  });
});

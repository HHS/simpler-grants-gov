import { fireEvent, render, screen } from "@testing-library/react";
import { Organization } from "src/types/applicationResponseTypes";
import { useTranslationsMock } from "src/utils/testing/intlMocks";

import SavedOpportunityOwnershipFilter from "./SavedOpportunityOwnershipFilter";

const setQueryParamMock = jest.fn();
const removeQueryParamMock = jest.fn();

jest.mock("next-intl", () => ({
  useTranslations: () => useTranslationsMock(),
}));

jest.mock("src/hooks/useSearchParamUpdater", () => ({
  useSearchParamUpdater: () => ({
    setQueryParam: setQueryParamMock,
    removeQueryParam: removeQueryParamMock,
  }),
}));

describe("SavedOpportunityOwnershipFilter", () => {
  const organizations: Organization[] = [
    {
      organization_id: "org-2",
      sam_gov_entity: {
        legal_business_name: "Bravo Org",
        uei: "UEI000002",
        expiration_date: "2026-01-01",
        ebiz_poc_email: "bravo@example.com",
        ebiz_poc_first_name: "Bravo",
        ebiz_poc_last_name: "User",
      },
    },
    {
      organization_id: "org-1",
      sam_gov_entity: {
        legal_business_name: "Alpha Org",
        uei: "UEI000001",
        expiration_date: "2026-01-01",
        ebiz_poc_email: "alpha@example.com",
        ebiz_poc_first_name: "Alpha",
        ebiz_poc_last_name: "User",
      },
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("does not render when there are no organizations", () => {
    const { container } = render(
      <SavedOpportunityOwnershipFilter organizations={[]} savedBy={null} />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it("renders options in the correct order", () => {
    render(
      <SavedOpportunityOwnershipFilter
        organizations={organizations}
        savedBy={null}
      />,
    );

    const options = screen.getAllByRole("option");

    expect(options.map((option) => option.textContent)).toEqual([
      "ownershipFilter.showAll",
      "ownershipFilter.individual",
      "Alpha Org",
      "Bravo Org",
    ]);
  });

  it("removes the savedBy query param when Show all is selected", () => {
    render(
      <SavedOpportunityOwnershipFilter
        organizations={organizations}
        savedBy="individual"
      />,
    );

    fireEvent.change(screen.getByLabelText("ownershipFilter.label"), {
      target: { value: "all" },
    });

    expect(removeQueryParamMock).toHaveBeenCalledWith("savedBy");
  });

  it("sets the savedBy query param when Individual is selected", () => {
    render(
      <SavedOpportunityOwnershipFilter
        organizations={organizations}
        savedBy={null}
      />,
    );

    fireEvent.change(screen.getByLabelText("ownershipFilter.label"), {
      target: { value: "individual" },
    });

    expect(setQueryParamMock).toHaveBeenCalledWith("savedBy", "individual");
  });

  it("sets the savedBy query param when an organization is selected", () => {
    render(
      <SavedOpportunityOwnershipFilter
        organizations={organizations}
        savedBy={null}
      />,
    );

    fireEvent.change(screen.getByLabelText("ownershipFilter.label"), {
      target: { value: "organization:org-1" },
    });

    expect(setQueryParamMock).toHaveBeenCalledWith(
      "savedBy",
      "organization:org-1",
    );
  });
});

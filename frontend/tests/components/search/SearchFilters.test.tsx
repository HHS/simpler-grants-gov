import { render, screen } from "@testing-library/react";
import { identity } from "lodash";
import { useTranslationsMock } from "src/utils/testing/intlMocks";

import SearchFilters from "src/components/search/SearchFilters";

const mockUpdateQueryParams = jest.fn();

jest.mock("src/hooks/useSearchParamUpdater", () => ({
  useSearchParamUpdater: () => ({
    updateQueryParams: mockUpdateQueryParams,
  }),
}));

jest.mock("next-intl/server", () => ({
  getTranslations: () => identity,
  unstable_setRequestLocale: identity,
}));

jest.mock("next-intl", () => ({
  useTranslations: () => useTranslationsMock(),
}));

describe("SearchFilters", () => {
  it("Renders without errors", () => {
    render(
      <SearchFilters
        fundingInstrument={new Set()}
        eligibility={new Set()}
        agency={new Set()}
        category={new Set()}
        opportunityStatus={new Set()}
      />,
    );

    // making weird use of the mocked translation behavior to make sure that things render correctly, but w/e
    const component = screen.getByText("accordion.titles.funding");
    expect(component).toBeInTheDocument();
  });
});

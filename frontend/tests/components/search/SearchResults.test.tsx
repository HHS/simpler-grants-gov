import { render, screen } from "@testing-library/react";
import { identity } from "lodash";
import { useTranslationsMock } from "src/utils/testing/intlMocks";

import SearchResults from "src/components/search/SearchResults";

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

/*
  nested async server components (< ...Fetcher />) are currently breaking the render.
  stated workarounds are not working. to get testing minimally working, overriding
  Suspense to force display of fallback UI.

  for more see https://github.com/testing-library/react-testing-library/issues/1209
*/
jest.mock("react", () => ({
  ...jest.requireActual<typeof import("react")>("react"),
  Suspense: ({ fallback }: { fallback: React.Component }) => fallback,
}));

describe("SearchResults", () => {
  it("Renders without errors", () => {
    render(
      <SearchResults
        searchParams={{
          page: 1,
          sortby: "postedDateDesc",
          query: "",
          status: new Set(),
          fundingInstrument: new Set(),
          category: new Set(),
          agency: new Set(),
          eligibility: new Set(),
        }}
        query={""}
        loadingMessage={""}
      />,
    );

    const component = screen.getByText("resultsHeader.message");
    expect(component).toBeInTheDocument();
  });
});

import { render, screen } from "@testing-library/react";
import { useTranslationsMock } from "src/utils/testing/intlMocks";
import { FakeQueryProvider } from "src/utils/testing/providerMocks";

import { SearchResultsControls } from "src/components/search/SearchResultsControls/SearchResultsControls";

const mockUpdateQueryParams = jest.fn();
const clientFetchMock = jest.fn();

jest.mock("src/hooks/useSearchParamUpdater", () => ({
  useSearchParamUpdater: () => ({
    updateQueryParams: mockUpdateQueryParams,
  }),
}));

jest.mock("next-intl", () => ({
  useTranslations: () => useTranslationsMock(),
}));

jest.mock("src/hooks/useClientFetch", () => ({
  useClientFetch: () => ({
    clientFetch: (...args: unknown[]) => clientFetchMock(...args) as unknown,
  }),
}));

describe("SearchResultsControls", () => {
  it("shows total number of search results", () => {
    render(
      <FakeQueryProvider>
        <SearchResultsControls
          sortby="relevancy"
          page={1}
          totalResults="100"
          totalPages={2}
          query="something"
        />
      </FakeQueryProvider>,
    );

    expect(
      screen.getByRole("heading", { name: "resultsHeader.message 100" }),
    ).toBeInTheDocument();
  });
  it("shows a results export button", () => {
    render(
      <FakeQueryProvider>
        <SearchResultsControls
          sortby="relevancy"
          page={1}
          totalResults="100"
          totalPages={2}
          query="something"
        />
      </FakeQueryProvider>,
    );

    expect(screen.getByRole("button", { name: "title" })).toBeInTheDocument();
  });
  it("shows a sort dropdown", () => {
    render(
      <FakeQueryProvider>
        <SearchResultsControls
          sortby="relevancy"
          page={1}
          totalResults="100"
          totalPages={2}
          query="something"
        />
      </FakeQueryProvider>,
    );

    expect(
      screen.getByRole("combobox", { name: "sortBy.label" }),
    ).toBeInTheDocument();
  });
  it("shows a pagination section", () => {
    render(
      <FakeQueryProvider>
        <SearchResultsControls
          sortby="relevancy"
          page={1}
          totalResults="100"
          totalPages={2}
          query="something"
        />
      </FakeQueryProvider>,
    );

    expect(
      screen.getByRole("button", { name: "Next page" }),
    ).toBeInTheDocument();
  });
});

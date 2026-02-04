import { render, screen, within } from "@testing-library/react";
import { axe } from "jest-axe";
import {
  fakeAgencyOptions,
  fakeSearchQueryParamData,
} from "src/utils/testing/fixtures";
import { useTranslationsMock } from "src/utils/testing/intlMocks";

import { SavedSearchesList } from "src/components/workspace/SavedSearchesList";

const getSessionMock = jest.fn();

const mockSearchParams = new URLSearchParams();
const routerPush = jest.fn(() => Promise.resolve(true));

jest.mock("next/navigation", () => ({
  usePathname: jest.fn(() => "/test") as jest.Mock<string>,
  useRouter: () => ({
    push: routerPush,
  }),
  useSearchParams: jest.fn(
    () => mockSearchParams,
  ) as jest.Mock<URLSearchParams>,
}));

jest.mock("next-intl/server", () => ({
  // eslint-disable-next-line react-hooks/rules-of-hooks
  getTranslations: () => useTranslationsMock(),
}));

jest.mock("next-intl", () => ({
  useTranslations: () => useTranslationsMock(),
}));

jest.mock("src/services/auth/session", () => ({
  getSession: (): unknown => getSessionMock(),
}));

jest.mock("src/services/fetch/fetchers/savedOpportunityFetcher", () => ({
  fetchSavedOpportunities: () => [{ opportunity_id: 1 }],
}));

const makeSavedSearchResult = (overrides = {}) => ({
  name: "a name",
  id: "1",
  searchParams: fakeSearchQueryParamData,
  ...overrides,
});

const fakeParamDisplayMapping = {
  query: "query",
  status: "status",
  fundingInstrument: "fundingInstrument",
  eligibility: "eligibility",
  agency: "agency",
  assistanceListingNumber: "assistanceListingNumber",
  category: "category",
  page: "page",
  sortby: "sortby",
  closeDate: "closeDate",
  postedDate: "postedDate",
  costSharing: "costSharing",
  topLevelAgency: "topLevelAgency",
  andOr: "andOr",
};

describe("SavedSearchesList", () => {
  it("should not have accessibility violations", async () => {
    const { container } = render(
      <SavedSearchesList
        agencyOptions={fakeAgencyOptions}
        savedSearches={[makeSavedSearchResult()]}
        editText={"edit"}
        deleteText={"delete"}
        paramDisplayMapping={fakeParamDisplayMapping}
      />,
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
  it("renders an list item for each search result", () => {
    render(
      <SavedSearchesList
        agencyOptions={fakeAgencyOptions}
        savedSearches={[makeSavedSearchResult(), makeSavedSearchResult()]}
        editText={"edit"}
        deleteText={"delete"}
        paramDisplayMapping={fakeParamDisplayMapping}
      />,
    );
    const listItems = screen.getAllByRole("listitem");
    expect(listItems).toHaveLength(2);
  });

  it("renders the correct saved search link for each item", () => {
    render(
      <SavedSearchesList
        agencyOptions={fakeAgencyOptions}
        savedSearches={[
          makeSavedSearchResult(),
          makeSavedSearchResult({
            searchParams: {
              query: "another search term",
              status: "archived",
              fundingInstrument: "Grant",
              eligibility: "State Governments",
              agency: "Center for Disease Control",
              category: "Arts",
              page: "1",
              sortby: "relevancy",
            },
            id: "2",
          }),
        ]}
        editText={"edit"}
        deleteText={"delete"}
        paramDisplayMapping={fakeParamDisplayMapping}
      />,
    );
    const links = screen.getAllByRole("link");
    expect(links).toHaveLength(2);
    expect(links[0]).toHaveAttribute(
      "href",
      "/search?query=search term&status=forecasted,closed&fundingInstrument=cooperative_agreement&eligibility=individuals&agency=DOC-EDA&category=recovery_act&page=1&sortby=relevancy&savedSearch=1",
    );

    expect(links[1]).toHaveAttribute(
      "href",
      "/search?query=another search term&status=archived&fundingInstrument=Grant&eligibility=State Governments&agency=Center for Disease Control&category=Arts&page=1&sortby=relevancy&savedSearch=2",
    );
  });
  it("renders properly formatted search parameter names and values for each list item", () => {
    render(
      <SavedSearchesList
        agencyOptions={fakeAgencyOptions}
        savedSearches={[
          makeSavedSearchResult(),
          makeSavedSearchResult({
            searchParams: {
              query: "another search term",
              category: "arts",
            },
            id: "2",
          }),
        ]}
        editText={"edit"}
        deleteText={"delete"}
        paramDisplayMapping={fakeParamDisplayMapping}
      />,
    );
    const listItems = screen.getAllByRole("listitem");
    expect(listItems).toHaveLength(2);

    const definitionOne = within(listItems[0]).getByTestId(
      "saved-search-definition",
    );

    expect(definitionOne).toHaveTextContent("query: search term");
    expect(definitionOne).toHaveTextContent("status: Forecasted, Closed");
    expect(definitionOne).toHaveTextContent(
      "fundingInstrument: Cooperative Agreement",
    );
    expect(definitionOne).toHaveTextContent("eligibility: Individuals");
    expect(definitionOne).toHaveTextContent(
      "agency: Economic Development Administration",
    );
    expect(definitionOne).toHaveTextContent("category: Recovery Act");

    const definitionTwo = within(listItems[1]).getByTestId(
      "saved-search-definition",
    );

    expect(definitionTwo).toHaveTextContent("query: another search term");
    expect(definitionTwo).toHaveTextContent("category: Arts");
  });

  it("renders edit and delete modal button items for each list item", async () => {
    render(
      <SavedSearchesList
        agencyOptions={fakeAgencyOptions}
        savedSearches={[
          makeSavedSearchResult(),
          makeSavedSearchResult({
            searchParams: {
              query: "another search term",
              category: "Arts",
            },
            id: "2",
          }),
        ]}
        editText={"edit"}
        deleteText={"delete"}
        paramDisplayMapping={fakeParamDisplayMapping}
      />,
    );
    const listItems = screen.getAllByRole("listitem");
    expect(listItems).toHaveLength(2);

    const buttonsOne = await within(listItems[0]).findAllByRole("button");
    expect(buttonsOne).toHaveLength(2);

    expect(buttonsOne[0]).toHaveTextContent("edit");
    expect(buttonsOne[1]).toHaveTextContent("delete");

    const buttonsTwo = await within(listItems[1]).findAllByRole("button");
    expect(buttonsTwo).toHaveLength(2);

    expect(buttonsTwo[0]).toHaveTextContent("edit");
    expect(buttonsTwo[1]).toHaveTextContent("delete");
  });
});

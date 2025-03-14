import { fireEvent, render, screen } from "@testing-library/react";
import { noop } from "lodash";
import { fakeSavedSearch } from "src/utils/testing/fixtures";
import { useTranslationsMock } from "src/utils/testing/intlMocks";

import { ReadonlyURLSearchParams } from "next/navigation";

import { SaveSearchSelector } from "src/components/search/SaveSearchSelector";

const mockUseUser = jest.fn();
const mockObtainSavedSearches = jest.fn();
const fakeSavedSearchRecord = {
  name: "saved search name",
  saved_search_id: "an id",
  search_query: fakeSavedSearch,
};

jest.mock("src/services/auth/useUser", () => ({
  useUser: (): unknown => mockUseUser(),
}));

jest.mock("next-intl", () => ({
  useTranslations: () => useTranslationsMock(),
}));

jest.mock("src/hooks/useSearchParamUpdater", () => ({
  useSearchParamUpdater: () => ({
    searchParams: new ReadonlyURLSearchParams(),
    replaceQueryParams: jest.fn(),
  }),
}));

jest.mock("src/services/fetch/fetchers/clientSavedSearchFetcher", () => ({
  obtainSavedSearches: () => mockObtainSavedSearches() as unknown,
}));

describe("SaveSearchSelector", () => {
  beforeEach(() => {
    mockUseUser.mockReturnValue({ user: { token: "a token" } });
  });
  afterEach(() => {
    jest.resetAllMocks();
  });
  it("does not render a select if no saved searches exist", () => {
    mockObtainSavedSearches.mockResolvedValue([]);
    render(
      <SaveSearchSelector
        newSavedSearches={[]}
        savedSearches={[]}
        setSavedSearches={noop}
      />,
    );

    expect(screen.queryByTestId("Select")).not.toBeInTheDocument();
  });
  it("renders an alert on error fetching saved searches", async () => {
    mockObtainSavedSearches.mockRejectedValue(new Error("o no"));
    render(
      <SaveSearchSelector
        newSavedSearches={[]}
        savedSearches={[]}
        setSavedSearches={noop}
      />,
    );

    expect(screen.queryByTestId("Select")).not.toBeInTheDocument();
    const alert = await screen.findByTestId("simpler-alert");
    expect(alert).toBeInTheDocument();
  });

  // this is totally synthetic - in real life we'd allow the selector to update the parent state, and then reconsume it
  // I had a test passing that did this more elegantly, but got bored trying to get the typing to work - DWS
  it("renders a select if saved searches exist (prop drilling)", async () => {
    mockObtainSavedSearches.mockResolvedValue([fakeSavedSearchRecord]);
    const { rerender } = render(
      <SaveSearchSelector
        newSavedSearches={[]}
        savedSearches={[]}
        setSavedSearches={noop}
      />,
    );

    rerender(
      <SaveSearchSelector
        newSavedSearches={[fakeSavedSearchRecord.saved_search_id]}
        savedSearches={[fakeSavedSearchRecord]}
        setSavedSearches={noop}
      />,
    );
    const select = await screen.findByTestId("Select");
    expect(select).toBeInTheDocument();
  });

  it("renders default option and option for each saved search", async () => {
    mockObtainSavedSearches.mockResolvedValue([]); // since we're prop drilling the searches this doesn't matter here
    render(
      <SaveSearchSelector
        newSavedSearches={[fakeSavedSearchRecord.saved_search_id]}
        savedSearches={[fakeSavedSearchRecord]}
        setSavedSearches={noop}
      />,
    );
    const options = await screen.findAllByRole("option");
    expect(options).toHaveLength(2);
    expect(options[0]).toBeDisabled();
    expect((options[0] as HTMLOptionElement).selected).toEqual(true);
    expect(options[0]).toHaveTextContent("defaultSelect");
    expect(options[1]).toHaveTextContent(fakeSavedSearchRecord.name);
  });
  it("selects correct saved search on select", async () => {
    mockObtainSavedSearches.mockResolvedValue([]);
    render(
      <SaveSearchSelector
        newSavedSearches={[fakeSavedSearchRecord.saved_search_id]}
        savedSearches={[fakeSavedSearchRecord]}
        setSavedSearches={noop}
      />,
    );

    const select = await screen.findByTestId("Select");
    fireEvent.select(select, {
      target: { value: fakeSavedSearchRecord.saved_search_id },
    });

    const selectedOption = screen.getByRole("option", { selected: true });
    expect(selectedOption).toHaveTextContent(fakeSavedSearchRecord.name);
  });
  it("fetches saved searches at initial render, login, and new saved search", () => {
    mockUseUser.mockReturnValue({ user: { token: "first token" } });
    mockObtainSavedSearches.mockResolvedValue([fakeSavedSearchRecord]);
    const { rerender } = render(
      <SaveSearchSelector
        newSavedSearches={[]}
        savedSearches={[]}
        setSavedSearches={noop}
      />,
    );

    expect(mockObtainSavedSearches).toHaveBeenCalledTimes(1);
    mockUseUser.mockReturnValue({ user: { token: "second token" } });

    rerender(
      <SaveSearchSelector
        newSavedSearches={[]}
        savedSearches={[]}
        setSavedSearches={noop}
      />,
    );

    expect(mockObtainSavedSearches).toHaveBeenCalledTimes(2);

    rerender(
      <SaveSearchSelector
        newSavedSearches={[fakeSavedSearchRecord.saved_search_id]}
        savedSearches={[fakeSavedSearchRecord]}
        setSavedSearches={noop}
      />,
    );

    expect(mockObtainSavedSearches).toHaveBeenCalledTimes(3);
  });
});

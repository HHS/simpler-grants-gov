import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { noop } from "lodash";
import { fakeSavedSearch } from "src/utils/testing/fixtures";
import { useTranslationsMock } from "src/utils/testing/intlMocks";

import { ReadonlyURLSearchParams } from "next/navigation";

import { SaveSearchSelector } from "src/components/search/SaveSearchSelector";

const mockUseUser = jest.fn();
const clientFetchMock = jest.fn();
const fakeSavedSearchRecord = {
  name: "saved search name",
  saved_search_id: "an id",
  search_query: fakeSavedSearch,
};
let fakeSearchParams = new ReadonlyURLSearchParams();

jest.mock("src/services/auth/useUser", () => ({
  useUser: (): unknown => mockUseUser(),
}));

jest.mock("next-intl", () => ({
  useTranslations: () => useTranslationsMock(),
}));

jest.mock("src/hooks/useSearchParamUpdater", () => ({
  useSearchParamUpdater: () => ({
    searchParams: fakeSearchParams,
    replaceQueryParams: jest.fn(),
    removeQueryParam: jest.fn(),
  }),
}));

jest.mock("src/hooks/useClientFetch", () => ({
  useClientFetch: () => ({
    clientFetch: (...args: unknown[]) => clientFetchMock(...args) as unknown,
  }),
}));

describe("SaveSearchSelector", () => {
  beforeEach(() => {
    mockUseUser.mockReturnValue({ user: { token: "a token" } });
    fakeSearchParams = new ReadonlyURLSearchParams();
  });
  afterEach(() => {
    jest.resetAllMocks();
  });
  it("does not render a select if no saved searches exist", () => {
    clientFetchMock.mockResolvedValue([]);
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
    clientFetchMock.mockRejectedValue(new Error("o no"));
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
    clientFetchMock.mockResolvedValue([fakeSavedSearchRecord]);
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
    clientFetchMock.mockResolvedValue([]); // since we're prop drilling the searches this doesn't matter here
    render(
      <SaveSearchSelector
        newSavedSearches={[]}
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

  it("selects new saved search option when present", async () => {
    clientFetchMock.mockResolvedValue([]); // since we're prop drilling the searches this doesn't matter here
    render(
      <SaveSearchSelector
        newSavedSearches={[fakeSavedSearchRecord.saved_search_id]}
        savedSearches={[fakeSavedSearchRecord]}
        setSavedSearches={noop}
      />,
    );
    const options = await screen.findAllByRole("option");
    expect(options).toHaveLength(2);
    await waitFor(() =>
      expect((options[1] as HTMLOptionElement).selected).toEqual(true),
    );
  });
  it("selects correct saved search on select", async () => {
    clientFetchMock.mockResolvedValue([]);
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
    clientFetchMock.mockResolvedValue([fakeSavedSearchRecord]);
    const { rerender } = render(
      <SaveSearchSelector
        newSavedSearches={[]}
        savedSearches={[]}
        setSavedSearches={noop}
      />,
    );

    expect(clientFetchMock).toHaveBeenCalledTimes(1);
    mockUseUser.mockReturnValue({ user: { token: "second token" } });

    rerender(
      <SaveSearchSelector
        newSavedSearches={[]}
        savedSearches={[]}
        setSavedSearches={noop}
      />,
    );

    expect(clientFetchMock).toHaveBeenCalledTimes(2);

    rerender(
      <SaveSearchSelector
        newSavedSearches={[fakeSavedSearchRecord.saved_search_id]}
        savedSearches={[fakeSavedSearchRecord]}
        setSavedSearches={noop}
      />,
    );

    expect(clientFetchMock).toHaveBeenCalledTimes(3);
  });
  it("sets selected search based on savedSearch query parameter", async () => {
    mockUseUser.mockReturnValue({ user: { token: "first token" } });
    clientFetchMock.mockResolvedValue([]);
    fakeSearchParams = new ReadonlyURLSearchParams(
      `savedSearch=${fakeSavedSearchRecord.saved_search_id}`,
    );
    render(
      <SaveSearchSelector
        newSavedSearches={[]}
        savedSearches={[fakeSavedSearchRecord]}
        setSavedSearches={noop}
      />,
    );
    const options = await screen.findAllByRole("option");
    expect(options).toHaveLength(2);
    await waitFor(() => {
      const selectedOption = screen.getByRole("option", { selected: true });
      return expect(selectedOption).toHaveTextContent(
        fakeSavedSearchRecord.name,
      );
    });
  });
});

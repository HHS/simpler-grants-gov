import { act, render, waitFor } from "@testing-library/react";
import SearchAnalytics from "src/app/[locale]/(base)/search/_components/SearchAnalytics";
import { OptionalStringDict } from "src/types/generalTypes";
import type { NewRelicBrowser } from "src/utils/analyticsUtil";

import { StrictMode } from "react";

const sendGAEventMock = jest.fn();
const waitForNewRelicMock = jest.fn();
const addPageActionMock = jest.fn();

jest.mock("@next/third-parties/google", () => ({
  /* eslint-disable-next-line @typescript-eslint/no-unsafe-return */
  sendGAEvent: (...args: unknown[]) => sendGAEventMock(...args),
}));

// only mock waiting for new relic, so that the event sent to the browser object can be verified
jest.mock("src/utils/analyticsUtil", () => ({
  ...jest.requireActual<object>("src/utils/analyticsUtil"),
  waitForNewRelic: () => waitForNewRelicMock() as unknown,
}));

type WindowWithNewRelic = Window & { newrelic?: NewRelicBrowser };

const basicParams = {
  fundingInstrument: "cooperative_agreement",
  status: "posted, archived",
  agency: "AC,PAMS-SC",
  page: "1",
  query: "a random search term",
};

const basicSearchAttempt = {
  search_param_fundingInstrument: "cooperative_agreement",
  search_param_status: "posted, archived",
  search_param_agency: "AC,PAMS-SC",
  search_param_page: "1",
  search_param_query: "a random search term",
  search_param_query_length: 20,
  search_filter_count: 3,
};

// lets a test control when waiting for new relic finishes
const deferNewRelicReady = () => {
  let resolveReady: (ready: boolean) => void = () => {};
  waitForNewRelicMock.mockReturnValue(
    new Promise<boolean>((resolve) => {
      resolveReady = resolve;
    }),
  );
  return async (ready = true) => {
    await act(async () => {
      resolveReady(ready);
      await Promise.resolve();
    });
  };
};

// waits for the search_attempt event that is sent once new relic is initialized
const renderWithNewRelic = async (params: OptionalStringDict) => {
  const view = render(
    <SearchAnalytics params={params} newRelicEnabled={true} />,
  );
  await waitFor(() => expect(addPageActionMock).toHaveBeenCalledTimes(1));
  return view;
};

describe("SearchAnalytics", () => {
  beforeEach(() => {
    (window as WindowWithNewRelic).newrelic = {
      addPageAction: addPageActionMock,
    };
    waitForNewRelicMock.mockResolvedValue(true);
  });

  afterEach(() => {
    delete (window as WindowWithNewRelic).newrelic;
    jest.resetAllMocks();
  });

  it("calls sendGAEvent with expected params on render", () => {
    const { rerender } = render(
      <SearchAnalytics params={basicParams} newRelicEnabled={false} />,
    );
    expect(sendGAEventMock).toHaveBeenCalledWith("event", "search_attempt", {
      search_filters:
        '{"fundingInstrument":"cooperative_agreement","status":"posted, archived","agency":"AC,PAMS-SC"}',
    });

    rerender(
      <SearchAnalytics
        params={{
          status: "posted, archived, closed",
          agency: "AC",
          category: "recovery_act",
          page: "1",
          query: "a random search term",
        }}
        newRelicEnabled={false}
      />,
    );
    expect(sendGAEventMock).toHaveBeenCalledWith("event", "search_attempt", {
      search_filters:
        '{"status":"posted, archived, closed","agency":"AC","category":"recovery_act"}',
    });
  });

  it("sends the same GA event when New Relic is enabled", async () => {
    await renderWithNewRelic(basicParams);
    expect(sendGAEventMock).toHaveBeenCalledTimes(1);
    expect(sendGAEventMock).toHaveBeenCalledWith("event", "search_attempt", {
      search_filters:
        '{"fundingInstrument":"cooperative_agreement","status":"posted, archived","agency":"AC,PAMS-SC"}',
    });
  });

  it("does not waitForNewRelic if New Relic is not enabled", () => {
    render(<SearchAnalytics params={basicParams} newRelicEnabled={false} />);
    expect(waitForNewRelicMock).not.toHaveBeenCalled();
  });

  it("does not send a New Relic event if New Relic is not enabled", () => {
    const { rerender } = render(
      <SearchAnalytics params={basicParams} newRelicEnabled={false} />,
    );

    rerender(
      <SearchAnalytics
        params={{
          ...basicParams,
          page: "2",
        }}
        newRelicEnabled={false}
      />,
    );
    expect(addPageActionMock).not.toHaveBeenCalled();
  });

  it("does not send a New Relic event if New Relic is not initialized", async () => {
    waitForNewRelicMock.mockResolvedValue(false);
    const { rerender } = render(
      <SearchAnalytics params={basicParams} newRelicEnabled={true} />,
    );
    await waitFor(() => expect(waitForNewRelicMock).toHaveBeenCalled());

    rerender(
      <SearchAnalytics
        params={{
          ...basicParams,
          page: "2",
        }}
        newRelicEnabled={true}
      />,
    );
    expect(addPageActionMock).not.toHaveBeenCalled();
  });

  it("sends one search_attempt event with all active search params once New Relic initializes", async () => {
    await renderWithNewRelic(basicParams);
    expect(addPageActionMock).toHaveBeenCalledWith(
      "search_attempt",
      basicSearchAttempt,
    );
  });

  it("sends another search_attempt event with the new search state when params change", async () => {
    const { rerender } = await renderWithNewRelic(basicParams);

    rerender(
      <SearchAnalytics
        params={{
          ...basicParams,
          page: "2",
        }}
        newRelicEnabled={true}
      />,
    );
    expect(addPageActionMock).toHaveBeenCalledTimes(2);
    expect(addPageActionMock).toHaveBeenLastCalledWith("search_attempt", {
      ...basicSearchAttempt,
      search_param_page: "2",
    });
  });

  it("does not send a duplicate event when the same params are received again", async () => {
    const { rerender } = await renderWithNewRelic(basicParams);

    rerender(
      <SearchAnalytics params={{ ...basicParams }} newRelicEnabled={true} />,
    );
    expect(addPageActionMock).toHaveBeenCalledTimes(1);
  });

  it("does not send a duplicate event when the same params are received in a different order", async () => {
    const { rerender } = await renderWithNewRelic(basicParams);

    rerender(
      <SearchAnalytics
        params={{
          query: "a random search term",
          page: "1",
          agency: "AC,PAMS-SC",
          status: "posted, archived",
          fundingInstrument: "cooperative_agreement",
        }}
        newRelicEnabled={true}
      />,
    );
    expect(addPageActionMock).toHaveBeenCalledTimes(1);
  });

  it("does not send params that were cleared from the search state", async () => {
    const { rerender } = await renderWithNewRelic(basicParams);

    rerender(
      <SearchAnalytics
        params={{ page: "1", query: "a random search term" }}
        newRelicEnabled={true}
      />,
    );
    expect(addPageActionMock).toHaveBeenLastCalledWith("search_attempt", {
      search_param_page: "1",
      search_param_query: "a random search term",
      search_param_query_length: 20,
      search_filter_count: 0,
    });
  });

  it("excludes unapproved and empty params", async () => {
    render(
      <SearchAnalytics
        params={{
          page: "1",
          query: "",
          status: "",
          agency: undefined,
          eligibility: "individuals",
          utm_source: "newsletter",
          savedSearch: "saved-search-id",
          email: "someone@example.com",
          notAFilter: "anything",
        }}
        newRelicEnabled={true}
      />,
    );
    await waitFor(() => expect(addPageActionMock).toHaveBeenCalledTimes(1));
    expect(addPageActionMock).toHaveBeenCalledWith("search_attempt", {
      search_param_page: "1",
      search_param_eligibility: "individuals",
      search_param_utm_source: "newsletter",
      search_param_savedSearch: "saved-search-id",
      search_param_query_length: 0,
      search_filter_count: 1,
    });
  });

  it("sends the page and a query length of 0 for the default search state", async () => {
    // the search page supplies page 1 when the url has no page param
    render(<SearchAnalytics params={{ page: "1" }} newRelicEnabled={true} />);
    await waitFor(() => expect(addPageActionMock).toHaveBeenCalledTimes(1));
    expect(addPageActionMock).toHaveBeenCalledWith("search_attempt", {
      search_param_page: "1",
      search_param_query_length: 0,
      search_filter_count: 0,
    });
  });

  it("sends only the current search state when params change before New Relic initializes", async () => {
    const resolveNewRelicReady = deferNewRelicReady();
    const { rerender } = render(
      <SearchAnalytics params={basicParams} newRelicEnabled={true} />,
    );
    rerender(
      <SearchAnalytics
        params={{ ...basicParams, status: "forecasted" }}
        newRelicEnabled={true}
      />,
    );
    expect(addPageActionMock).not.toHaveBeenCalled();

    await resolveNewRelicReady();

    expect(addPageActionMock).toHaveBeenCalledTimes(1);
    expect(addPageActionMock).toHaveBeenCalledWith("search_attempt", {
      ...basicSearchAttempt,
      search_param_status: "forecasted",
    });
  });

  it("sends an event for each search state when returning to a previous search", async () => {
    const { rerender } = await renderWithNewRelic(basicParams);
    rerender(
      <SearchAnalytics
        params={{ ...basicParams, page: "2" }}
        newRelicEnabled={true}
      />,
    );
    rerender(<SearchAnalytics params={basicParams} newRelicEnabled={true} />);

    expect(addPageActionMock).toHaveBeenCalledTimes(3);
    expect(addPageActionMock.mock.calls).toEqual([
      ["search_attempt", basicSearchAttempt],
      ["search_attempt", { ...basicSearchAttempt, search_param_page: "2" }],
      ["search_attempt", basicSearchAttempt],
    ]);
  });

  it("sends one event on mount in Strict Mode", async () => {
    render(
      <StrictMode>
        <SearchAnalytics params={basicParams} newRelicEnabled={true} />
      </StrictMode>,
    );
    await waitFor(() => expect(addPageActionMock).toHaveBeenCalledTimes(1));
    await act(async () => {
      await Promise.resolve();
    });
    expect(addPageActionMock).toHaveBeenCalledTimes(1);
  });

  it("does not send an event if unmounted before New Relic initializes", async () => {
    const resolveNewRelicReady = deferNewRelicReady();
    const { unmount } = render(
      <SearchAnalytics params={basicParams} newRelicEnabled={true} />,
    );
    unmount();

    await resolveNewRelicReady();

    expect(addPageActionMock).not.toHaveBeenCalled();
  });

  it("does not send an event after unmount", async () => {
    const { unmount } = await renderWithNewRelic(basicParams);
    unmount();
    expect(addPageActionMock).toHaveBeenCalledTimes(1);
  });

  it("does not send an event if New Relic is disabled before it initializes", async () => {
    const resolveNewRelicReady = deferNewRelicReady();
    const { rerender } = render(
      <SearchAnalytics params={basicParams} newRelicEnabled={true} />,
    );
    rerender(<SearchAnalytics params={basicParams} newRelicEnabled={false} />);

    await resolveNewRelicReady();

    expect(addPageActionMock).not.toHaveBeenCalled();
  });

  it("initializes and sends the current search state when New Relic becomes enabled", async () => {
    const { rerender } = render(
      <SearchAnalytics params={basicParams} newRelicEnabled={false} />,
    );
    expect(waitForNewRelicMock).not.toHaveBeenCalled();

    rerender(<SearchAnalytics params={basicParams} newRelicEnabled={true} />);

    await waitFor(() => expect(addPageActionMock).toHaveBeenCalledTimes(1));
    expect(addPageActionMock).toHaveBeenCalledWith(
      "search_attempt",
      basicSearchAttempt,
    );
  });

  it("stops sending events when New Relic is disabled and resumes with the current search state", async () => {
    const { rerender } = await renderWithNewRelic(basicParams);

    rerender(
      <SearchAnalytics
        params={{ ...basicParams, page: "2" }}
        newRelicEnabled={false}
      />,
    );
    expect(addPageActionMock).toHaveBeenCalledTimes(1);

    rerender(
      <SearchAnalytics
        params={{ ...basicParams, page: "3" }}
        newRelicEnabled={true}
      />,
    );
    await waitFor(() => expect(addPageActionMock).toHaveBeenCalledTimes(2));
    expect(addPageActionMock).toHaveBeenLastCalledWith("search_attempt", {
      ...basicSearchAttempt,
      search_param_page: "3",
    });
  });

  it("does not change the GA event frequency when New Relic initializes", async () => {
    const resolveNewRelicReady = deferNewRelicReady();
    const { rerender } = render(
      <SearchAnalytics params={basicParams} newRelicEnabled={true} />,
    );
    await resolveNewRelicReady();
    expect(sendGAEventMock).toHaveBeenCalledTimes(1);

    rerender(
      <SearchAnalytics
        params={{ ...basicParams, page: "2" }}
        newRelicEnabled={true}
      />,
    );
    expect(sendGAEventMock).toHaveBeenCalledTimes(2);
  });

  describe("search_filter_count", () => {
    const getSentSearchAttempt = async (params: OptionalStringDict) => {
      render(<SearchAnalytics params={params} newRelicEnabled={true} />);
      await waitFor(() => expect(addPageActionMock).toHaveBeenCalledTimes(1));
      const [, searchAttempt] = addPageActionMock.mock.calls[0] as [
        string,
        Record<string, unknown>,
      ];
      return searchAttempt;
    };

    it("is 0 when no filters are active", async () => {
      const searchAttempt = await getSentSearchAttempt({ page: "1" });
      expect(searchAttempt.search_filter_count).toEqual(0);
    });

    it("is 1 when one filter is active", async () => {
      const searchAttempt = await getSentSearchAttempt({
        page: "1",
        status: "posted",
      });
      expect(searchAttempt.search_filter_count).toEqual(1);
    });

    it("counts each active filter category", async () => {
      const searchAttempt = await getSentSearchAttempt({
        page: "1",
        status: "posted",
        agency: "HHS-NIH11",
        eligibility: "individuals",
        category: "health",
        closeDate: "7",
      });
      expect(searchAttempt.search_filter_count).toEqual(5);
    });

    it.each([
      ["agency only", { agency: "HHS-NIH11" }, 1],
      ["topLevelAgency only", { topLevelAgency: "HHS" }, 1],
      [
        "agency and topLevelAgency",
        { agency: "DOC-NIST", topLevelAgency: "HHS" },
        1,
      ],
      [
        "agency, topLevelAgency and status",
        { agency: "DOC-NIST", topLevelAgency: "HHS", status: "posted" },
        2,
      ],
    ])(
      "counts the Agency filter once for %s",
      async (_description, filters, expectedCount) => {
        const searchAttempt = await getSentSearchAttempt({
          page: "1",
          ...filters,
        });
        expect(searchAttempt.search_filter_count).toEqual(expectedCount);
      },
    );

    it("counts a filter with multiple selected values once", async () => {
      const searchAttempt = await getSentSearchAttempt({
        page: "1",
        status: "forecasted,posted,closed",
        agency: "HHS,DOC,USDA",
      });
      expect(searchAttempt.search_filter_count).toEqual(2);
    });

    it("does not count non filter or empty params", async () => {
      const searchAttempt = await getSentSearchAttempt({
        page: "2",
        query: "research",
        sortby: "relevancy",
        andOr: "OR",
        utm_source: "newsletter",
        savedSearch: "saved-search-id",
        notAFilter: "anything",
        status: "",
        agency: undefined,
        category: "health",
      });
      expect(searchAttempt.search_filter_count).toEqual(1);
    });

    it("decreases on the next event when a filter is cleared", async () => {
      const { rerender } = await renderWithNewRelic(basicParams);
      expect(addPageActionMock).toHaveBeenLastCalledWith(
        "search_attempt",
        expect.objectContaining({ search_filter_count: 3 }),
      );

      const { agency: _agency, ...withoutAgency } = basicParams;
      rerender(
        <SearchAnalytics params={withoutAgency} newRelicEnabled={true} />,
      );
      expect(addPageActionMock).toHaveBeenCalledTimes(2);
      expect(addPageActionMock).toHaveBeenLastCalledWith(
        "search_attempt",
        expect.objectContaining({ search_filter_count: 2 }),
      );
    });
  });
});

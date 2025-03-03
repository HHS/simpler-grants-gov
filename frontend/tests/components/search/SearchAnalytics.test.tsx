import { render } from "@testing-library/react";

import SearchAnalytics from "src/components/search/SearchAnalytics";

const sendGAEventMock = jest.fn();
const waitForNewRelicMock = jest.fn();
const setNewRelicCustomAttributeMock = jest.fn();
const unsetAllNewRelicQueryAttributesMock = jest.fn();

jest.mock("@next/third-parties/google", () => ({
  /* eslint-disable-next-line @typescript-eslint/no-unsafe-return */
  sendGAEvent: (...args: unknown[]) => sendGAEventMock(...args),
}));

jest.mock("src/utils/analyticsUtil", () => ({
  waitForNewRelic: () => waitForNewRelicMock() as unknown,
  setNewRelicCustomAttribute: (...args: unknown[]): unknown =>
    setNewRelicCustomAttributeMock(...args),
  unsetAllNewRelicQueryAttributes: () =>
    unsetAllNewRelicQueryAttributesMock() as unknown,
}));

const basicParams = {
  fundingInstrument: "cooperative_agreement",
  status: "posted, archived",
  agency: "AC,PAMS-SC",
  page: "1",
  query: "a random search term",
};

describe("SearchAnalytics", () => {
  afterEach(() => {
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

  it("does not waitForNewRelic if New Relic is not enabled", () => {
    render(<SearchAnalytics params={basicParams} newRelicEnabled={false} />);
    expect(waitForNewRelicMock).not.toHaveBeenCalled();
  });

  it("does not attempt to set custom attributes if New Relic is not enabled", () => {
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
    expect(setNewRelicCustomAttributeMock).not.toHaveBeenCalled();
  });

  it("does not attempt to set custom attributes if New Relic is not initialized", () => {
    waitForNewRelicMock.mockResolvedValue(false);
    const { rerender } = render(
      <SearchAnalytics params={basicParams} newRelicEnabled={true} />,
    );

    rerender(
      <SearchAnalytics
        params={{
          ...basicParams,
          page: "2",
        }}
        newRelicEnabled={true}
      />,
    );
    expect(setNewRelicCustomAttributeMock).not.toHaveBeenCalled();
  });

  it("calls setNewRelicCustomAttribute for all search params when params change", async () => {
    waitForNewRelicMock.mockImplementation(() => {
      return Promise.resolve(true);
    });
    const { rerender } = render(
      <SearchAnalytics params={basicParams} newRelicEnabled={true} />,
    );

    // have to wait a tick for the wait promise to resolve
    const animationFramePromise = new Promise((resolve) => {
      requestAnimationFrame(resolve);
    });

    await animationFramePromise;

    rerender(
      <SearchAnalytics
        params={{
          ...basicParams,
          page: "2",
        }}
        newRelicEnabled={true}
      />,
    );
    Object.entries({
      ...basicParams,
      page: "2",
    }).forEach(([key, value]) => {
      expect(setNewRelicCustomAttributeMock).toHaveBeenCalledWith(key, value);
    });
  });

  it("calls unsetAllNewRelicQueryAttributes on cleanup", () => {
    waitForNewRelicMock.mockImplementation(() => {
      return Promise.resolve(true);
    });
    render(<SearchAnalytics params={basicParams} newRelicEnabled={true} />);

    expect(unsetAllNewRelicQueryAttributesMock).toHaveBeenCalled();
  });
});

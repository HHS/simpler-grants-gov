import { render } from "@testing-library/react";

import SearchAnalytics from "src/components/search/SearchAnalytics";

const sendGAEventMock = jest.fn();

jest.mock("@next/third-parties/google", () => ({
  /* eslint-disable-next-line @typescript-eslint/no-unsafe-return */
  sendGAEvent: (...args: unknown[]) => sendGAEventMock(...args),
}));

describe("SearchAnalytics", () => {
  it("calls sendGAEvent with expected params on render", () => {
    const { rerender } = render(
      <SearchAnalytics
        params={{
          fundingInstrument: "cooperative_agreement",
          status: "posted, archived",
          agency: "AC,PAMS-SC",
          page: "1",
          query: "a random search term",
        }}
      />,
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
      />,
    );
    expect(sendGAEventMock).toHaveBeenCalledWith("event", "search_attempt", {
      search_filters:
        '{"status":"posted, archived, closed","agency":"AC","category":"recovery_act"}',
    });
  });
});

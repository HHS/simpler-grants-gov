import { waitForNewRelic } from "src/utils/analyticsUtil";

jest.mock("src/constants/environments", () => ({
  environment: {
    NEW_RELIC_ENABLED: "true",
  },
}));
jest.useFakeTimers();

describe("waitForNewRelic", () => {
  afterEach(() => {
    // eslint-disable-next-line
    // @ts-ignore
    window.newrelic = undefined;
    jest.resetAllMocks();
  });
  it("returns true if new relic is found", async () => {
    // eslint-disable-next-line
    // @ts-ignore
    window.newrelic = {};
    const result = await waitForNewRelic();
    expect(result).toEqual(true);
  });
  it("when the timeout is reached returns false", async () => {
    // eslint-disable-next-line
    const resolution = new Promise<boolean>((resolve) =>
      waitForNewRelic().then((result) => {
        resolve(result);
      }),
    );
    await jest.runAllTimersAsync();

    const result = await resolution;
    expect(result).toEqual(false);
  });
});

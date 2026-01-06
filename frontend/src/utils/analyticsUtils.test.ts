import { validSearchQueryParamKeys } from "src/types/search/searchQueryTypes";
import {
  setNewRelicCustomAttribute,
  unsetAllNewRelicQueryAttributes,
  waitForNewRelic,
} from "src/utils/analyticsUtil";

jest.useFakeTimers();
const mockSetCustomAttribute = jest.fn();

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

describe("setNewRelicCustomAttribute", () => {
  afterEach(() => {
    // eslint-disable-next-line
    // @ts-ignore
    window.newrelic = undefined;
    jest.resetAllMocks();
  });
  it("does not attempt to call new relic if new relic does not exist", () => {
    setNewRelicCustomAttribute("key", "value");
    expect(mockSetCustomAttribute).not.toHaveBeenCalled();
  });
  it("calls new relic with passed values, with key properly prefixed", () => {
    // eslint-disable-next-line
    // @ts-ignore
    window.newrelic = {
      setCustomAttribute: mockSetCustomAttribute,
    };

    setNewRelicCustomAttribute("key", "value");
    expect(mockSetCustomAttribute).toHaveBeenCalledWith(
      "search_param_key",
      "value",
    );
  });
});

describe("unsetAllNewRelicQueryAttributes", () => {
  afterEach(() => {
    // eslint-disable-next-line
    // @ts-ignore
    window.newrelic = undefined;
    jest.resetAllMocks();
  });
  it("does not attempt to call new relic if new relic does not exist", () => {
    unsetAllNewRelicQueryAttributes();
    expect(mockSetCustomAttribute).not.toHaveBeenCalled();
  });
  it("calls new relic with passed values, with key properly prefixed", () => {
    // eslint-disable-next-line
    // @ts-ignore
    window.newrelic = {
      setCustomAttribute: mockSetCustomAttribute,
    };

    unsetAllNewRelicQueryAttributes();
    expect(mockSetCustomAttribute).toHaveBeenCalledTimes(
      validSearchQueryParamKeys.length,
    );
    validSearchQueryParamKeys.forEach((key) => {
      expect(mockSetCustomAttribute).toHaveBeenCalledWith(
        `search_param_${key}`,
        "",
      );
    });
  });
});

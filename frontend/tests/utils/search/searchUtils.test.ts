/**
 * @jest-environment node
 */

import { SearchFetcherActionType } from "src/types/search/searchRequestTypes";
import {
  areSetsEqual,
  convertSearchParamsToProperTypes,
  paramsToFormattedQuery,
  paramToDateRange,
} from "src/utils/search/searchUtils";
import { fakeSearchParamDict } from "src/utils/testing/fixtures";

describe("areSetsEqual", () => {
  it("returns false for sets of unequal size", () => {
    expect(areSetsEqual(new Set(["1"]), new Set(["1", "2"]))).toEqual(false);
  });
  it("returns false if sets contain any different strings", () => {
    expect(areSetsEqual(new Set(["", "1"]), new Set(["", "2"]))).toEqual(false);
  });
  it("returns true if sets contain all of the same items", () => {
    expect(areSetsEqual(new Set(["2", "1"]), new Set(["1", "2"]))).toEqual(
      true,
    );
  });
});

describe("paramsToFormattedQuery", () => {
  it("returns empty string if no params are passed", () => {
    expect(paramsToFormattedQuery(new URLSearchParams())).toEqual("");
  });
  it("stringifies URLSearchParams and prepends a question mark", () => {
    expect(
      paramsToFormattedQuery(
        new URLSearchParams([
          ["key", "value"],
          ["big", "small"],
          ["simpler", "grants"],
        ]),
      ),
    ).toEqual("?key=value&big=small&simpler=grants");
  });
  it("unencrypts commas", () => {
    expect(
      paramsToFormattedQuery(
        new URLSearchParams([
          ["key", "value,anotherValue"],
          ["big", "small"],
          ["simpler", "grants"],
        ]),
      ),
    ).toEqual("?key=value,anotherValue&big=small&simpler=grants");
  });
});

describe("paramToDateRange", () => {
  it("returns empty set if no param value", () => {
    expect(paramToDateRange()).toEqual(new Set());
  });
  it("returns first value in set if only one param value", () => {
    expect(paramToDateRange("hi")).toEqual(new Set(["hi"]));
  });
  it("returns set of first two values (comma separated) in param otherwise", () => {
    expect(paramToDateRange("hi,there")).toEqual(new Set(["hi", "there"]));
    expect(paramToDateRange("hi,there,again")).toEqual(
      new Set(["hi", "there"]),
    );
  });
});

describe("convertSearchParamsToProperTypes", () => {
  it("converts search param strings to proper types", () => {
    expect(
      convertSearchParamsToProperTypes({
        unhandledParam: "whatever",
        closeDate: "7",
        ...fakeSearchParamDict,
      }),
    ).toEqual({
      unhandledParam: "whatever",
      query: fakeSearchParamDict.query,
      status: new Set(fakeSearchParamDict.status.split(",")),
      fundingInstrument: new Set([fakeSearchParamDict.fundingInstrument]),
      eligibility: new Set([fakeSearchParamDict.eligibility]),
      agency: new Set([fakeSearchParamDict.agency]),
      category: new Set([fakeSearchParamDict.category]),
      closeDate: new Set(["7"]),
      costSharing: new Set(),
      andOr: fakeSearchParamDict.andOr,
      sortby: fakeSearchParamDict.sortby,
      page: 1,
      actionType: SearchFetcherActionType.InitialLoad,
    });
  });
});

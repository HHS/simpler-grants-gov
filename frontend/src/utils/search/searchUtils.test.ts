/**
 * @jest-environment node
 */

import { SearchFetcherActionType } from "src/types/search/searchRequestTypes";
import {
  areSetsEqual,
  convertSearchParamsToProperTypes,
  getAgencyParent,
  getSiblingOptionValues,
  getStatusValueForAgencySearch,
  paramsToFormattedQuery,
  paramToDateRange,
} from "src/utils/search/searchUtils";
import {
  fakeSearchParamDict,
  initialFilterOptions,
} from "src/utils/testing/fixtures";

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
        postedDate: "14",
        ...fakeSearchParamDict,
      }),
    ).toEqual({
      unhandledParam: "whatever",
      query: fakeSearchParamDict.query,
      status: new Set(fakeSearchParamDict.status.split(",")),
      fundingInstrument: new Set([fakeSearchParamDict.fundingInstrument]),
      eligibility: new Set([fakeSearchParamDict.eligibility]),
      agency: new Set([fakeSearchParamDict.agency]),
      assistanceListingNumber: new Set(),
      category: new Set([fakeSearchParamDict.category]),
      closeDate: new Set(["7"]),
      postedDate: new Set(["14"]),
      costSharing: new Set(),
      topLevelAgency: new Set(),
      andOr: fakeSearchParamDict.andOr,
      sortby: fakeSearchParamDict.sortby,
      page: 1,
      actionType: SearchFetcherActionType.InitialLoad,
    });
  });
});

describe("getAgencyParent", () => {
  it("returns the pre dash part of the agency code", () => {
    expect(getAgencyParent("PREFIX-SUFFIX")).toEqual("PREFIX");
  });
  it("does not break if there is no dash", () => {
    expect(getAgencyParent("WHATEVER")).toEqual("WHATEVER");
  });
  it("works with multiple dashes", () => {
    expect(getAgencyParent("HI-THERE-HOW-ARE-YOU")).toEqual("HI");
  });
});

describe("getSiblingOptionValues", () => {
  it("returns an empty array if parent is not found or has no children", () => {
    expect(getSiblingOptionValues("no-children", [])).toEqual([]);
    expect(getSiblingOptionValues("no-children", initialFilterOptions)).toEqual(
      [],
    );
    expect(
      getSiblingOptionValues("no-children", [
        { value: "no", id: "no", label: "no" },
      ]),
    ).toEqual([]);
  });
  it("returns all siblings but not the target node", () => {
    expect(
      getSiblingOptionValues("parent-target", [
        {
          value: "parent",
          id: "parent",
          label: "parent",
          children: [
            { value: "parent-target", id: "target", label: "target" },
            { value: "parent-sibling", id: "sibling", label: "sibling" },
            {
              value: "parent-another-sibling",
              id: "another-sibling",
              label: "another-sibling",
            },
          ],
        },
      ]),
    ).toEqual(["parent-sibling", "parent-another-sibling"]);
  });
});

describe("getStatusValueForAgencySearch", () => {
  it("returns all options if passed empty status array", () => {
    expect(getStatusValueForAgencySearch([])).toEqual([
      "forecasted",
      "posted",
      "closed",
      "archived",
    ]);
  });
  it("returns default options plus any passed options", () => {
    expect(getStatusValueForAgencySearch(["closed"])).toEqual([
      "closed",
      "forecasted",
      "posted",
    ]);
  });
});

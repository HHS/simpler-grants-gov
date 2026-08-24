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
  removeInvalidParamValues,
  sanitizeSearchParams,
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

describe("removeInvalidParamValues", () => {
  it("passes through params with no known set of valid values", () => {
    expect(removeInvalidParamValues("agency", "NOT-AN-AGENCY")).toEqual(
      "NOT-AN-AGENCY",
    );
    expect(removeInvalidParamValues("query", "not_a_status")).toEqual(
      "not_a_status",
    );
    expect(removeInvalidParamValues("savedSearch", "anything")).toEqual(
      "anything",
    );
  });
  it("passes through empty and undefined param values", () => {
    expect(removeInvalidParamValues("status", undefined)).toEqual(undefined);
    expect(removeInvalidParamValues("status", "")).toEqual("");
  });
  it("passes through valid param values", () => {
    expect(removeInvalidParamValues("status", "posted,closed")).toEqual(
      "posted,closed",
    );
    expect(removeInvalidParamValues("sortby", "closeDateAsc")).toEqual(
      "closeDateAsc",
    );
    expect(removeInvalidParamValues("andOr", "OR")).toEqual("OR");
    expect(removeInvalidParamValues("costSharing", "true")).toEqual("true");
    expect(removeInvalidParamValues("postedDate", "14")).toEqual("14");
  });
  it("allows the `none` status sentinel through", () => {
    expect(removeInvalidParamValues("status", "none")).toEqual("none");
  });
  it("removes invalid values and keeps the valid remainder", () => {
    expect(removeInvalidParamValues("status", "not_a_status,posted")).toEqual(
      "posted",
    );
    expect(removeInvalidParamValues("category", "health,nope,arts")).toEqual(
      "health,arts",
    );
  });
  it("returns undefined when no valid values are left", () => {
    expect(removeInvalidParamValues("status", "not_a_status")).toEqual(
      undefined,
    );
    expect(removeInvalidParamValues("sortby", "not_a_sort")).toEqual(undefined);
    expect(removeInvalidParamValues("closeDate", "999")).toEqual(undefined);
  });
});

describe("sanitizeSearchParams", () => {
  it("returns null when all param values are valid", () => {
    expect(sanitizeSearchParams(fakeSearchParamDict)).toEqual(null);
    expect(sanitizeSearchParams({})).toEqual(null);
  });
  it("removes params whose values are all invalid", () => {
    expect(sanitizeSearchParams({ status: "not_a_status" })).toEqual({});
    expect(
      sanitizeSearchParams({ query: "simpler", status: "not_a_status" }),
    ).toEqual({ query: "simpler" });
  });
  it("removes only the invalid values from a param", () => {
    expect(sanitizeSearchParams({ status: "not_a_status,posted" })).toEqual({
      status: "posted",
    });
  });
  it("leaves params without a known set of valid values alone", () => {
    expect(
      sanitizeSearchParams({
        agency: "NOT-AN-AGENCY",
        assistanceListingNumber: "00.000",
        topLevelAgency: "NOPE",
        status: "not_a_status",
      }),
    ).toEqual({
      agency: "NOT-AN-AGENCY",
      assistanceListingNumber: "00.000",
      topLevelAgency: "NOPE",
    });
  });
  it("is idempotent, so that sanitizing cannot loop", () => {
    const sanitized = sanitizeSearchParams({
      status: "not_a_status,posted",
      sortby: "not_a_sort",
    });
    expect(sanitized).toEqual({ status: "posted" });
    expect(
      sanitizeSearchParams(sanitized as { [key: string]: string }),
    ).toEqual(null);
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
  it("falls back to default statuses when every status value is invalid", () => {
    const converted = convertSearchParamsToProperTypes({
      status: "not_a_status",
    });
    expect(converted.status).toEqual(new Set(["forecasted", "posted"]));
  });
  it("keeps only the valid statuses when some are invalid", () => {
    const converted = convertSearchParamsToProperTypes({
      status: "not_a_status,closed",
    });
    expect(converted.status).toEqual(new Set(["closed"]));
  });
  it("drops invalid values across all hardcoded filters", () => {
    const converted = convertSearchParamsToProperTypes({
      fundingInstrument: "nope",
      eligibility: "nope",
      category: "nope",
      costSharing: "nope",
      closeDate: "999",
      postedDate: "999",
      sortby: "nope",
      andOr: "nope",
    });
    expect(converted.fundingInstrument).toEqual(new Set());
    expect(converted.eligibility).toEqual(new Set());
    expect(converted.category).toEqual(new Set());
    expect(converted.costSharing).toEqual(new Set());
    expect(converted.closeDate).toEqual(new Set());
    expect(converted.postedDate).toEqual(new Set());
    expect(converted.sortby).toEqual(null);
    expect(converted.andOr).toEqual("");
  });
  it("does not validate agency values, which are not hardcoded", () => {
    const converted = convertSearchParamsToProperTypes({
      agency: "MADE-UP",
      topLevelAgency: "MADE",
      assistanceListingNumber: "00.000",
    });
    expect(converted.agency).toEqual(new Set(["MADE-UP"]));
    expect(converted.topLevelAgency).toEqual(new Set(["MADE"]));
    expect(converted.assistanceListingNumber).toEqual(new Set(["00.000"]));
  });
  it("falls back to page 1 for a non numeric page param", () => {
    expect(convertSearchParamsToProperTypes({ page: "not_a_page" }).page).toBe(
      1,
    );
    expect(convertSearchParamsToProperTypes({ page: "0" }).page).toBe(1);
    expect(convertSearchParamsToProperTypes({ page: "-3" }).page).toBe(1);
    expect(convertSearchParamsToProperTypes({ page: "3" }).page).toBe(3);
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

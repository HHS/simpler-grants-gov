/**
 * @jest-environment node
 */

import { BaseOpportunity } from "src/types/opportunity/opportunityResponseTypes";
import { RelevantAgencyRecord } from "src/types/search/searchFilterTypes";
import { SearchFetcherActionType } from "src/types/search/searchRequestTypes";
import {
  agenciesToNestedFilterOptions,
  areSetsEqual,
  convertSearchParamsToProperTypes,
  getAgencyDisplayName,
  getAgencyParent,
  getSiblingOptionValues,
  paramsToFormattedQuery,
  paramToDateRange,
  sortFilterOptions,
} from "src/utils/search/searchUtils";
import {
  fakeAgencyResponseData,
  fakeSearchParamDict,
  initialFilterOptions,
} from "src/utils/testing/fixtures";

describe("sortFilterOptions", () => {
  it("alphabetically sorts top level and child options by label", () => {
    expect(
      sortFilterOptions([
        {
          id: "NARA",
          label: "National Archives and Records Administration",
          value: "NARA",
        },
        {
          id: "HUD",
          label: "Department of Housing and Urban Development",
          value: "HUD",
        },
        {
          id: "DOE",
          label: "Department of Energy",
          value: "DOE",
          children: [
            {
              id: "DOE-GFO",
              label: "Golden Field Office",
              value: "DOE-GFO",
            },
            {
              id: "DOE-NETL",
              label: "National Energy Technology Laboratory",
              value: "DOE-NETL",
            },
            {
              id: "DOE-ID",
              label: "Idaho Field Office",
              value: "DOE-ID",
            },
            {
              id: "DOE-CH",
              label: "Chicago Service Center",
              value: "DOE-CH",
            },
          ],
        },
        {
          id: "NASA",
          label: "National Aeronautics and Space Administration",
          value: "NASA",
          children: [
            {
              id: "NASA-GSFC",
              label: "NASA Goddard Space Flight Center",
              value: "NASA-GSFC",
            },
            {
              id: "NASA-HQ",
              label: "NASA Headquarters",
              value: "NASA-HQ",
            },
          ],
        },
      ]),
    ).toEqual([
      {
        id: "DOE",
        label: "Department of Energy",
        value: "DOE",
        children: [
          {
            id: "DOE-CH",
            label: "Chicago Service Center",
            value: "DOE-CH",
          },
          {
            id: "DOE-GFO",
            label: "Golden Field Office",
            value: "DOE-GFO",
          },
          {
            id: "DOE-ID",
            label: "Idaho Field Office",
            value: "DOE-ID",
          },
          {
            id: "DOE-NETL",
            label: "National Energy Technology Laboratory",
            value: "DOE-NETL",
          },
        ],
      },
      {
        id: "HUD",
        label: "Department of Housing and Urban Development",
        value: "HUD",
      },
      {
        id: "NASA",
        label: "National Aeronautics and Space Administration",
        value: "NASA",
        children: [
          {
            id: "NASA-GSFC",
            label: "NASA Goddard Space Flight Center",
            value: "NASA-GSFC",
          },
          {
            id: "NASA-HQ",
            label: "NASA Headquarters",
            value: "NASA-HQ",
          },
        ],
      },
      {
        id: "NARA",
        label: "National Archives and Records Administration",
        value: "NARA",
      },
    ]);
  });
});

describe("getAgencyDisplayName", () => {
  const fakeOpportunity = {
    agency_code: "NON-HMN-READABWOL",
    agency_name: "This Agency",
    top_level_agency_name: "The Parent",
    summary: {
      estimated_total_program_funding: 5000000,
      expected_number_of_awards: 10,
      award_ceiling: 1000000,
      award_floor: 50000,
      is_cost_sharing: true,
      funding_instruments: ["Grant", "Cooperative Agreement"],
      funding_categories: ["Education", "Health"],
      funding_category_description:
        "Support for education and health initiatives",
    },
    category: "Discretionary",
    category_explanation: "Funds allocated by agency discretion",
  } as BaseOpportunity;

  it("returns `--` if agency lookup fails", () => {
    expect(
      getAgencyDisplayName({
        ...fakeOpportunity,
        ...{ agency_code: null, agency_name: null },
      }),
    ).toEqual("--");
  });

  it("returns top level agency with agency name if available", () => {
    expect(getAgencyDisplayName(fakeOpportunity)).toEqual(
      "The Parent - This Agency",
    );
  });
  it("falls back to agency name for top level agencies", () => {
    expect(getAgencyDisplayName(fakeOpportunity)).toEqual(
      "The Parent - This Agency",
    );
  });
  it("falls back to agency name if top level agency is not available", () => {
    expect(
      getAgencyDisplayName({
        ...fakeOpportunity,
        ...{ top_level_agency_name: null },
      }),
    ).toEqual("This Agency");
  });
  it("falls back to agency code if agency name is not available", () => {
    expect(
      getAgencyDisplayName({ ...fakeOpportunity, ...{ agency_name: null } }),
    ).toEqual("NON-HMN-READABWOL");
  });
});

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

describe("agenciesToNestedFilterOptions", () => {
  it("converts a simple list of top level agencies to filter options", () => {
    expect(agenciesToNestedFilterOptions(fakeAgencyResponseData)).toEqual([
      {
        id: "DOCNIST",
        label: "National Institute of Standards and Technology",
        value: "DOCNIST",
      },
      {
        id: "MOCKNIST",
        label: "Mational Institute",
        value: "MOCKNIST",
      },
      {
        id: "MOCKTRASH",
        label: "Mational TRASH",
        value: "MOCKTRASH",
      },
      {
        id: "FAKEORG",
        label: "Completely fake",
        value: "FAKEORG",
      },
    ]);
  });

  it("converts a complex list of nested agencies to filter options", () => {
    const fakeAgencyResponseData: RelevantAgencyRecord[] = [
      {
        agency_code: "DOCNIST",
        agency_name: "National Institute of Standards and Technology",
        top_level_agency: null,
        agency_id: 1,
      },
      {
        agency_code: "Hello-HI",
        agency_name: "Hello",
        top_level_agency: {
          agency_code: "DOCNIST",
          agency_id: 2,
          agency_name: "irrelevant",
          top_level_agency: null,
        },
        agency_id: 1,
      },
      {
        agency_code: "MOCKNIST",
        agency_name: "Mational Institute",
        top_level_agency: null,
        agency_id: 1,
      },
      {
        agency_code: "MORE-TRASH",
        agency_name: "More TRASH",
        top_level_agency: {
          agency_code: "MOCKTRASH",
          agency_id: 2,
          agency_name: "irrelevant",
          top_level_agency: null,
        },
        agency_id: 1,
      },
      {
        agency_code: "MOCKTRASH",
        agency_name: "Mational TRASH",
        top_level_agency: null,
        agency_id: 1,
      },
      {
        agency_code: "FAKEORG",
        agency_name: "Completely fake",
        top_level_agency: null,
        agency_id: 1,
      },
      {
        agency_code: "There-Again",
        agency_name: "Again",
        top_level_agency: {
          agency_code: "DOCNIST",
          agency_id: 2,
          agency_name: "irrelevant",
          top_level_agency: null,
        },
        agency_id: 1,
      },
    ];
    expect(agenciesToNestedFilterOptions(fakeAgencyResponseData)).toEqual([
      {
        id: "DOCNIST",
        label: "National Institute of Standards and Technology",
        value: "DOCNIST",
        children: [
          {
            id: "Hello-HI",
            label: "Hello",
            value: "Hello-HI",
          },
          {
            id: "There-Again",
            label: "Again",
            value: "There-Again",
          },
        ],
      },
      {
        id: "MOCKNIST",
        label: "Mational Institute",
        value: "MOCKNIST",
      },
      {
        id: "MOCKTRASH",
        label: "Mational TRASH",
        value: "MOCKTRASH",
        children: [
          {
            id: "MORE-TRASH",
            label: "More TRASH",
            value: "MORE-TRASH",
          },
        ],
      },
      {
        id: "FAKEORG",
        label: "Completely fake",
        value: "FAKEORG",
      },
    ]);
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

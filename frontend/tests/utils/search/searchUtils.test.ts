import { BaseOpportunity } from "src/types/opportunity/opportunityResponseTypes";
import {
  areSetsEqual,
  getAgencyDisplayName,
  sortFilterOptions,
} from "src/utils/search/searchUtils";

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
      estimatedTotalProgramFunding: 5000000,
      expectedNumberOfAwards: 10,
      awardCeiling: 1000000,
      awardFloor: 50000,
      isCostSharing: true,
      fundingInstruments: ["Grant", "Cooperative Agreement"],
      fundingCategories: ["Education", "Health"],
      fundingCategoryDescription:
        "Support for education and health initiatives",
    },
    category: "Discretionary",
    categoryExplanation: "Funds allocated by agency discretion",
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

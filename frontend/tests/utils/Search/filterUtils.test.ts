import { BaseOpportunity } from "src/types/opportunity/opportunityResponseTypes";
import { RelevantAgencyRecord } from "src/types/search/searchFilterTypes";
import {
  agenciesToNestedFilterOptions,
  agencyToFilterOption,
  flattenAgencies,
  floatTopLevelAgencies,
  formatPillLabel,
  formatPillLabels,
  getAgencyDisplayName,
  getFilterOptionLabel,
  sortFilterOptions,
} from "src/utils/search/filterUtils";
import {
  fakeAgencyResponseData,
  fakeAgencyResponseDataWithTopLevel,
  initialFilterOptions,
  searchFetcherParams,
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
        agency_code: "MOCKNIST",
        agency_name: "Mational Institute",
        top_level_agency: null,
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
        agency_code: "MOCKTRASH-TRASH",
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
    const result = agenciesToNestedFilterOptions(fakeAgencyResponseData);
    expect(result).toEqual([
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
            id: "MOCKTRASH-TRASH",
            label: "More TRASH",
            value: "MOCKTRASH-TRASH",
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

describe("flattenAgencies", () => {
  it("flattens a list of sub agencies to include top level agencies on the same level", () => {
    expect(flattenAgencies(fakeAgencyResponseDataWithTopLevel)).toEqual([
      {
        agency_code: "DOC-DOCNIST",
        agency_name: "National Institute of Standards and Technology",
        top_level_agency: {
          agency_code: "DOC",
          agency_name: "Detroit Optical Company",
          agency_id: 11,
          top_level_agency: null,
        },
        agency_id: 1,
      },
      {
        agency_code: "DOC",
        agency_name: "Detroit Optical Company",
        agency_id: 11,
        top_level_agency: null,
      },
      {
        agency_code: "MOCK-NIST",
        agency_name: "Mational Institute",
        top_level_agency: {
          agency_code: "MOCK",
          agency_name: "A mock",
          agency_id: 12,
          top_level_agency: null,
        },
        agency_id: 2,
      },
      {
        agency_code: "MOCK",
        agency_name: "A mock",
        agency_id: 12,
        top_level_agency: null,
      },
      {
        agency_code: "MOCKTRASH",
        agency_name: "Mational TRASH",
        top_level_agency: {
          agency_code: "MOCK",
          agency_name: "A mock",
          agency_id: 12,
          top_level_agency: null,
        },
        agency_id: 3,
      },
      {
        agency_code: "FAKEORG",
        agency_name: "Completely fake",
        top_level_agency: null,
        agency_id: 4,
      },
    ]);
  });
});

describe("floatTopLevelAgencies", () => {
  it("floats top level agencies to the top of a list of agencies", () => {
    expect(
      floatTopLevelAgencies([
        {
          agency_code: "FAKE",
          agency_name: "National Institute of Standards and Technology",
          top_level_agency: null,
          agency_id: 1,
        },
        {
          agency_code: "MOCK-TRASH",
          agency_name: "Mational TRASH",
          top_level_agency: {
            agency_code: "MOCK",
            agency_name: "Mational Institute",
            top_level_agency: null,
            agency_id: 5,
          },
          agency_id: 2,
        },
        {
          agency_code: "MOCK",
          agency_name: "Mational Institute",
          top_level_agency: null,
          agency_id: 5,
        },
        {
          agency_code: "FAKE-ORG",
          agency_name: "Completely fake",
          top_level_agency: {
            agency_code: "FAKE",
            agency_name: "National Institute of Standards and Technology",
            top_level_agency: null,
            agency_id: 1,
          },
          agency_id: 4,
        },
      ]),
    ).toEqual([
      {
        agency_code: "FAKE",
        agency_name: "National Institute of Standards and Technology",
        top_level_agency: null,
        agency_id: 1,
      },
      {
        agency_code: "MOCK",
        agency_name: "Mational Institute",
        top_level_agency: null,
        agency_id: 5,
      },
      {
        agency_code: "MOCK-TRASH",
        agency_name: "Mational TRASH",
        top_level_agency: {
          agency_code: "MOCK",
          agency_name: "Mational Institute",
          top_level_agency: null,
          agency_id: 5,
        },
        agency_id: 2,
      },
      {
        agency_code: "FAKE-ORG",
        agency_name: "Completely fake",
        top_level_agency: {
          agency_code: "FAKE",
          agency_name: "National Institute of Standards and Technology",
          top_level_agency: null,
          agency_id: 1,
        },
        agency_id: 4,
      },
    ]);
  });
});

describe("agencyToFilterOption", () => {
  it("translates an agency record into a filter option", () => {
    expect(
      agencyToFilterOption({
        agency_code: "FAKE-ORG",
        agency_name: "Completely fake",
        top_level_agency: {
          agency_code: "FAKE",
          agency_name: "National Institute of Standards and Technology",
          top_level_agency: null,
          agency_id: 1,
        },
        agency_id: 4,
      }),
    ).toEqual({ id: "FAKE-ORG", label: "Completely fake", value: "FAKE-ORG" });
  });
});

describe("getFilterOptionLabel", () => {
  it("returns an empty string if option value not found in supplied list", () => {
    expect(getFilterOptionLabel("special-value", initialFilterOptions)).toEqual(
      "",
    );
  });
  it("returns the option label from list", () => {
    expect(
      getFilterOptionLabel(
        "special-value",
        initialFilterOptions.concat([
          {
            value: "special-value",
            id: "special-value",
            label: "Special label",
          },
        ]),
      ),
    ).toEqual("Special label");
  });
});

describe("formatPillLabel", () => {
  it("returns correct label for cost sharing", () => {
    expect(
      formatPillLabel("costSharing", "yes", [
        { value: "yes", label: "sure", id: "yes" },
      ]),
    ).toEqual("Cost sharing: sure");
  });
  it("returns correct label for close date", () => {
    expect(
      formatPillLabel("closeDate", "yes", [
        { value: "yes", label: "sure", id: "yes" },
      ]),
    ).toEqual("Closing within yes days");
  });
  it("returns correct label for everything else", () => {
    expect(
      formatPillLabel("status", "yes", [
        { value: "yes", label: "sure", id: "yes" },
      ]),
    ).toEqual("sure");
  });
});

describe("formatPillLabels", () => {
  it("returns correctly formatted labels for all types of pills", () => {
    const result = formatPillLabels(
      {
        ...searchFetcherParams,
        agency: new Set(["FAKE-SUB", "MOCK-SUB"]),
        topLevelAgency: new Set(["FAKE", "MOCK"]),
      },
      [
        { id: "FAKE-SUB", label: "Fake sub", value: "FAKE-SUB" },
        { id: "MOCK-SUB", label: "Mock sub", value: "MOCK-SUB" },
        { id: "FAKE", label: "Fake top", value: "FAKE" },
        { id: "MOCK", label: "Mock top", value: "MOCK" },
      ],
    );
    expect(result).toEqual([
      {
        label: "Forecasted",
        queryParamKey: "status",
        queryParamValue: "forecasted",
      },
      {
        label: "Open",
        queryParamKey: "status",
        queryParamValue: "posted",
      },
      {
        label: "Grant",
        queryParamKey: "fundingInstrument",
        queryParamValue: "grant",
      },
      {
        label: "Cooperative Agreement",
        queryParamKey: "fundingInstrument",
        queryParamValue: "cooperative_agreement",
      },
      {
        label: "Fake sub",
        queryParamKey: "agency",
        queryParamValue: "FAKE-SUB",
      },
      {
        label: "Mock sub",
        queryParamKey: "agency",
        queryParamValue: "MOCK-SUB",
      },
      {
        label: "Fake top",
        queryParamKey: "topLevelAgency",
        queryParamValue: "FAKE",
      },
      {
        label: "Mock top",
        queryParamKey: "topLevelAgency",
        queryParamValue: "MOCK",
      },
    ]);
  });
});

import {
  agenciesToFilterOptions,
  getAgenciesForFilterOptions,
  obtainAgencies,
  RelevantAgencyRecord,
} from "src/services/fetch/fetchers/agenciesFetcher";

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
];

const mockfetchAgencies = jest.fn((_arg) => {
  return Promise.resolve({
    json: () => Promise.resolve({ data: fakeAgencyResponseData }),
  });
});
const mockSortFilterOptions = jest.fn();

jest.mock("src/services/fetch/fetchers/fetchers", () => ({
  fetchAgencies: (arg: unknown): unknown => mockfetchAgencies(arg),
}));

jest.mock("src/utils/search/searchUtils", () => ({
  sortFilterOptions: (arg: unknown): unknown => mockSortFilterOptions(arg),
}));

describe("obtainAgencies", () => {
  it("calls request function with correct parameters", async () => {
    const result = await obtainAgencies();

    expect(mockfetchAgencies).toHaveBeenCalledWith({
      body: {
        pagination: {
          order_by: "created_at", // this seems to be the only supported option
          page_offset: 1,
          page_size: 100, // should fetch them all. db seems to have 74 records as of 1/17/25
          sort_direction: "ascending",
        },
      },
      nextOptions: {
        revalidate: 604800,
      },
    });

    expect(result).toEqual(fakeAgencyResponseData);
  });
});

describe("agenciesToFilterOptions", () => {
  it("converts a simple list of top level agencies to filter options", () => {
    expect(agenciesToFilterOptions(fakeAgencyResponseData)).toEqual([
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
        top_level_agency: { agency_code: "DOCNIST" },
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
        top_level_agency: { agency_code: "MOCKTRASH" },
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
        top_level_agency: { agency_code: "DOCNIST" },
        agency_id: 1,
      },
    ];
    expect(agenciesToFilterOptions(fakeAgencyResponseData)).toEqual([
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

describe("getAgenciesForFilterOptions", () => {
  it("immediately returns prefetched agencies if supplied", async () => {
    const prefetchedOptions = [
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
    ];
    const result = await getAgenciesForFilterOptions(prefetchedOptions);
    expect(result).toEqual(prefetchedOptions);
  });
  it("sorts", async () => {
    await getAgenciesForFilterOptions();
    expect(mockSortFilterOptions).toHaveBeenCalledWith([
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
});

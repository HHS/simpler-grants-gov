import {
  obtainAgencies,
  performAgencySearch,
  searchAndFlattenAgencies,
} from "src/services/fetch/fetchers/agenciesFetcher";
import { fakeAgencyResponseData } from "src/utils/testing/fixtures";

const fakeResponse = {
  json: () => Promise.resolve({ data: fakeAgencyResponseData }),
  status: 200,
};

const fakeSortedOptions = [
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

const mockSortFilterOptions = jest.fn();
const mockFetchAgencies = jest.fn().mockResolvedValue(fakeResponse);
const mockSearchAgencies = jest.fn().mockResolvedValue(fakeResponse);
const mockFlattenAgencies = jest.fn().mockReturnValue(fakeAgencyResponseData);
const mockAgenciesToFilterOptions = jest
  .fn()
  .mockReturnValue(fakeSortedOptions);

jest.mock("src/services/fetch/fetchers/fetchers", () => ({
  fetchAgencies: (arg: unknown): unknown => mockFetchAgencies(arg),
  searchAgencies: (arg: unknown): unknown => mockSearchAgencies(arg),
}));

jest.mock("src/utils/search/searchUtils", () => ({
  sortFilterOptions: (arg: unknown): unknown => mockSortFilterOptions(arg),
  agenciesToFilterOptions: (arg: unknown): unknown =>
    mockAgenciesToFilterOptions(arg),
  flattenAgencies: (arg: unknown): unknown => mockFlattenAgencies(arg),
}));

describe("obtainAgencies", () => {
  it("calls request function with correct parameters", async () => {
    const result = await obtainAgencies();

    expect(mockFetchAgencies).toHaveBeenCalledWith({
      body: {
        filters: { active: true },
        pagination: {
          page_offset: 1,
          page_size: 1500,
          sort_order: [
            {
              order_by: "created_at",
              sort_direction: "ascending",
            },
          ],
        },
      },
      nextOptions: {
        revalidate: 604800,
      },
    });

    expect(result).toEqual(fakeAgencyResponseData);
  });
});

describe("performAgencySearch", () => {
  it("calls request function with correct parameters", async () => {
    const result = await performAgencySearch("anything");

    expect(mockSearchAgencies).toHaveBeenCalledWith({
      body: {
        filters: { active: true },
        pagination: {
          page_offset: 1,
          page_size: 1500,
          sort_order: [
            {
              order_by: "agency_code",
              sort_direction: "ascending",
            },
          ],
        },
        query: "anything",
      },
    });

    expect(result).toEqual(fakeAgencyResponseData);
  });
});

describe("searchAndFlattenAgencies", () => {
  beforeEach(() => {
    mockFetchAgencies.mockResolvedValue(fakeResponse);
    mockSearchAgencies.mockResolvedValue(fakeResponse);
    mockFlattenAgencies.mockReturnValue(fakeAgencyResponseData);
    mockAgenciesToFilterOptions.mockReturnValue(fakeSortedOptions);
  });
  afterEach(() => {
    jest.resetAllMocks();
  });
  it("calls fetch, flattens, transforms, and sorts", async () => {
    await searchAndFlattenAgencies("anything");
    expect(mockSearchAgencies).toHaveBeenCalledWith({
      body: {
        pagination: {
          page_offset: 1,
          page_size: 1500, // 969 agencies in prod as of 3/7/25
          sort_order: [
            {
              order_by: "agency_code",
              sort_direction: "ascending",
            },
          ],
        },
        filters: { active: true },
        query: "anything",
      },
    });
    expect(mockFlattenAgencies).toHaveBeenCalledWith(fakeAgencyResponseData);
    expect(mockAgenciesToFilterOptions).toHaveBeenCalledWith(
      fakeAgencyResponseData,
    );
    expect(mockSortFilterOptions).toHaveBeenCalledWith(fakeSortedOptions);
  });
});

// describe("getAgenciesForFilterOptions", () => {
//   beforeEach(() => {
//     mockFetchAgencies.mockResolvedValue(fakeResponse);
//     mockSearchAgencies.mockResolvedValue(fakeResponse);
//     mockFlattenAgencies.mockReturnValue(fakeAgencyResponseData);
//     mockAgenciesToFilterOptions.mockReturnValue(fakeSortedOptions);
//   });
//   afterEach(() => {
//     jest.resetAllMocks();
//   });
//   it("calls fetch, transforms, and sorts", async () => {
//     await getAgenciesForFilterOptions();

//     expect(mockFetchAgencies).toHaveBeenCalledWith({
//       body: {
//         pagination: {
//           page_offset: 1,
//           page_size: 1500, // 969 agencies in prod as of 3/7/25
//           sort_order: [
//             {
//               order_by: "created_at",
//               sort_direction: "ascending",
//             },
//           ],
//         },
//         filters: { active: true },
//       },
//       nextOptions: {
//         revalidate: 604800,
//       },
//     });
//     expect(mockAgenciesToFilterOptions).toHaveBeenCalledWith(
//       fakeAgencyResponseData,
//     );

//     expect(mockSortFilterOptions).toHaveBeenCalledWith(fakeSortedOptions);
//   });
// });

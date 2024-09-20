import Search from 'src/app/[locale]/search/page';
import {
  MockSearchFetcher,
} from 'src/services/search/searchfetcher/MockSearchFetcher';

import {
  render,
  screen,
} from '@testing-library/react';

function mockUseTranslations(translationKey: string) {
  return translationKey;
}

mockUseTranslations.rich = (translationKey: string) => translationKey;

// test without feature flag functionality
jest.mock("src/hoc/search/withFeatureFlag", () =>
  jest.fn((Component: React.Component) => Component),
);

// test without i18n functionality
jest.mock("next-intl/server", () => ({
  getTranslations: jest.fn(() => (translationKey: string) => translationKey),
  unstable_setRequestLocale: jest.fn(),
}));

jest.mock("next-intl", () => ({
  useTranslations: () => mockUseTranslations,
}));

// jest.mock("src/services/search/searchfetcher/SearchFetcherUtil", () => ({
//   getSearchFetcher: () => ({
//     fetchOpportunities: () =>
//       Promise.resolve({
//         pagination_info: {
//           total_records: 10,
//           total_pages: 1,
//         },
//         status_code: 200,
//         data: [basicOpportunityFixture],
//       }),
//   }),
// }));

jest.mock("src/services/search/searchfetcher/SearchFetcherUtil", () => ({
  getSearchFetcher: () => new MockSearchFetcher(),
}));

jest.mock("next/navigation", () => ({
  ...jest.requireActual("next/navigation"),
  useRouter: () => ({
    push: () => {},
  }),
}));

// const globalFetchReference = global.fetch;

// const mockedOpportunityResponse = {
//   // from Body interface
//   body: null,
//   bodyUsed: true,
//   arrayBuffer: () => Promise.resolve(new ArrayBuffer(1)),
//   blob: () => Promise.resolve(new Blob()),
//   formData: () => Promise.resolve(new FormData()),
//   json: () => Promise.resolve(basicOpportunityFixture),
//   text: () => Promise.resolve(JSON.stringify(basicOpportunityFixture)),

//   // from Response interface
//   headers: new Headers(),
//   ok: true,
//   redirected: false,
//   status: 200,
//   statusText: "200",
//   type: "default" as ResponseType,
//   url: "http://realultimatepower.net",
//   clone: () => mockedOpportunityResponse,
// };

describe("Search Route", () => {
  // beforeEach(() => {
  //   global.fetch = jest.fn(() => Promise.resolve(mockedOpportunityResponse));
  // });
  // afterEach(() => {
  //   global.fetch = globalFetchReference;
  // });
  it("renders the search page when feature flag is enabled", async () => {
    // global.fetch = jest.fn().mockResolvedValue({
    //   json: jest.fn().mockResolvedValue({ login: "Gio" }),
    // });

    const mockSearchParams = {
      query: "?status=forecasted,posted",
    };

    const ResolvedSearchPage = await Search({
      searchParams: mockSearchParams,
    });
    render(ResolvedSearchPage);

    expect(screen.getByText("Mocked Search Form")).toBeInTheDocument();
  });
});

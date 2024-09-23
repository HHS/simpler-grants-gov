import { render, screen } from "@testing-library/react";
import Search from "src/app/[locale]/search/page";
import { MockSearchFetcher } from "src/services/search/searchfetcher/MockSearchFetcher";

function mockUseTranslations(translationKey: string) {
  return translationKey;
}

mockUseTranslations.rich = (translationKey: string) => translationKey;

// test without feature flag functionality
jest.mock("src/hoc/search/withFeatureFlag", () =>
  jest.fn((Component: React.Component) => Component),
);

// test without i18n functionality, pass through translation key as text
jest.mock("next-intl/server", () => ({
  getTranslations: jest.fn(() => (translationKey: string) => translationKey),
  unstable_setRequestLocale: jest.fn(),
}));

jest.mock("next-intl", () => ({
  useTranslations: () => mockUseTranslations,
}));

// mock API interactions
jest.mock("src/services/search/searchfetcher/SearchFetcherUtil", () => ({
  getSearchFetcher: () => new MockSearchFetcher(),
}));

jest.mock("next/navigation", () => ({
  ...jest.requireActual<typeof import("next/navigation")>("next/navigation"),
  useRouter: () => ({
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    push: () => {},
  }),
}));

/*
  nested async server components (< ...Fetcher />) are currently breaking the render.
  stated workarounds are not working. to get testing minimally working, overriding
  Suspense to force display of fallback UI.

  for more see https://github.com/testing-library/react-testing-library/issues/1209
*/
jest.mock("react", () => ({
  ...jest.requireActual<typeof import("react")>("react"),
  Suspense: ({ fallback }: { fallback: React.Component }) => fallback,
}));

describe("Search Route", () => {
  it("renders the search page with expected checkboxes checked", async () => {
    const mockSearchParams = {
      status: "forecasted,posted",
    };

    render(<Search searchParams={mockSearchParams} />);

    // translation service is mocked, so the expected label here is the translation key rather than the label text
    const forecastedCheckbox = await screen.findByLabelText(
      "opportunityStatus.label.forecasted",
    );
    expect(forecastedCheckbox).toBeInTheDocument();
    expect(forecastedCheckbox).toBeChecked();

    const postedCheckbox = await screen.findByLabelText(
      "opportunityStatus.label.posted",
    );
    expect(postedCheckbox).toBeInTheDocument();
    expect(postedCheckbox).toBeChecked();

    const closedCheckbox = await screen.findByLabelText(
      "opportunityStatus.label.closed",
    );
    expect(closedCheckbox).toBeInTheDocument();
    expect(closedCheckbox).not.toBeChecked();

    const archivedCheckbox = await screen.findByLabelText(
      "opportunityStatus.label.archived",
    );
    expect(archivedCheckbox).toBeInTheDocument();
    expect(archivedCheckbox).not.toBeChecked();
  });
});

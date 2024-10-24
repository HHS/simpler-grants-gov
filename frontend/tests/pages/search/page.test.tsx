import { render, screen } from "@testing-library/react";
import { identity } from "lodash";
import Search from "src/app/[locale]/search/page";
import { useTranslationsMock } from "src/utils/testing/intlMocks";

// test without feature flag functionality
jest.mock("src/hoc/search/withFeatureFlag", () =>
  jest.fn((Component: React.Component) => Component),
);

jest.mock("next-intl/server", () => ({
  getTranslations: () => identity,
  unstable_setRequestLocale: identity,
}));

jest.mock("next-intl", () => ({
  useTranslations: () => useTranslationsMock(),
}));

// // currently, with Suspense mocked out below to always show fallback content,
// // the components making the fetch calls are never being rendered so we do not need to mock them out
// // uncomment this if we figure out a way to properly test the underlying async components
// jest.mock("src/app/api/fetchers", () => ({
//   get searchOpportunityFetcher() {
//     return new MockSearchOpportunityAPI();
//   },
// }));

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
// */
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

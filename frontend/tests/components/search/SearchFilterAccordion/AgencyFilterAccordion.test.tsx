import { render, screen } from "@testing-library/react";
import { axe } from "jest-axe";
import { useTranslationsMock } from "src/utils/testing/intlMocks";

import { ReadonlyURLSearchParams } from "next/navigation";

import { AgencyFilterAccordion } from "src/components/search/SearchFilterAccordion/AgencyFilterAccordion";

jest.mock("next-intl", () => ({
  useTranslations: () => useTranslationsMock(),
}));

jest.mock("src/hooks/useSearchParamUpdater", () => ({
  useSearchParamUpdater: () => ({
    searchParams: new ReadonlyURLSearchParams(),
    updateQueryParams: () => undefined,
  }),
}));

jest.mock("react", () => ({
  ...jest.requireActual<typeof import("react")>("react"),
  Suspense: ({ fallback }: { fallback: React.Component }) => fallback,
}));

const fakeOptions = [
  {
    id: "DOC-NIST",
    label: "National Institute of Standards and Technology",
    value: "DOC-NIST",
    children: [
      {
        id: "HI",
        label: "Hello",
        value: "HI",
      },
      {
        id: "There",
        label: "Again",
        value: "There",
      },
    ],
  },
  {
    id: "MOCK-NIST",
    label: "Mational Institute",
    value: "MOCK-NIST",
  },
  {
    id: "MOCK-TRASH",
    label: "Mational TRASH",
    value: "MOCK-TRASH",
    children: [
      {
        id: "TRASH",
        label: "More TRASH",
        value: "TRASH",
      },
    ],
  },
  {
    id: "FAKE",
    label: "Completely fake",
    value: "FAKE",
  },
];

describe("AgencyFilterAccordion", () => {
  it("is accessible", async () => {
    const component = await AgencyFilterAccordion({
      facetCounts: {},
      agencyOptionsPromise: Promise.resolve(fakeOptions),
      query: new Set(),
    });
    const { container } = render(component);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  // just want to confirm it renders
  it("renders async component (asserting on mock suspended state)", async () => {
    const component = await AgencyFilterAccordion({
      facetCounts: {},
      agencyOptionsPromise: Promise.resolve(fakeOptions),
      query: new Set(),
    });
    render(component);

    expect(screen.getByText("accordion.titles.agency")).toBeInTheDocument();
  });
});

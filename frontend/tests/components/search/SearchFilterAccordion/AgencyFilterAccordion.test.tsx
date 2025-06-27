import { render, screen } from "@testing-library/react";
import { axe } from "jest-axe";
import {
  fakeAgencyResponseData,
  fakeSearchAPIResponse,
} from "src/utils/testing/fixtures";
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

describe("AgencyFilterAccordion", () => {
  it("is accessible", async () => {
    const component = await AgencyFilterAccordion({
      topLevelQuery: new Set(),
      agencyOptionsPromise: Promise.resolve([
        fakeAgencyResponseData,
        fakeSearchAPIResponse,
      ]),
      query: new Set(),
    });
    const { container } = render(component);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  // just want to confirm it renders
  it("renders async component (asserting on mock suspended state)", async () => {
    const component = await AgencyFilterAccordion({
      topLevelQuery: new Set(),
      agencyOptionsPromise: Promise.resolve([
        fakeAgencyResponseData,
        fakeSearchAPIResponse,
      ]),
      query: new Set(),
    });
    render(component);

    expect(screen.getByText("accordion.titles.agency")).toBeInTheDocument();
  });
});

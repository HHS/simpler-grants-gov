import { render, screen } from "@testing-library/react";
import { identity } from "lodash";
import AwardRecommendationsListHeader from "src/app/[locale]/(base)/award-recommendation/_components/AwardRecommendationsListHeader";
import { RelevantAgencyRecord } from "src/types/search/searchFilterTypes";

jest.mock("next-intl", () => ({
  useTranslations: () => identity,
}));

jest.mock(
  "src/app/[locale]/(base)/grantor/opportunities/_components/AgencySelector",
  () => ({
    AgencySelector: () => <div data-testid="agency-selector" />,
  }),
);

const agencies: RelevantAgencyRecord[] = [
  {
    agency_id: 1,
    agency_name: "Agency One",
    agency_code: "A1",
    top_level_agency: null,
  },
  {
    agency_id: 2,
    agency_name: "Agency Two",
    agency_code: "A2",
    top_level_agency: null,
  },
];

describe("AwardRecommendationsListHeader", () => {
  it("renders the count, agency selector, and create button", () => {
    render(
      <AwardRecommendationsListHeader
        awardRecommendationsCount={10}
        agencies={agencies}
        currentAgencyId="1"
      />,
    );

    expect(screen.getByText("numAwardRecommendations")).toBeInTheDocument();
    expect(screen.getByTestId("agency-selector")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "createRecommendationButton" }),
    ).toHaveAttribute("href", "/award-recommendation/create");
  });

  it("hides the count and create button when no agency is selected", () => {
    render(
      <AwardRecommendationsListHeader
        awardRecommendationsCount={0}
        agencies={agencies}
        currentAgencyId=""
      />,
    );

    expect(
      screen.queryByText("numAwardRecommendations"),
    ).not.toBeInTheDocument();
    expect(screen.getByTestId("agency-selector")).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "createRecommendationButton" }),
    ).not.toBeInTheDocument();
  });
});

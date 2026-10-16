import { render, screen } from "@testing-library/react";
import { Competition } from "src/types/competitionsResponseTypes";
import { OpportunityStatus } from "src/types/opportunity/opportunityResponseTypes";

import { OpportunityApplyAction } from "./OpportunityApplyAction";

// note that next-intl is mocked globally, translations render as their keys

let mockApplyFormPrototypeOff = false;

jest.mock("src/hooks/useFeatureFlags", () => ({
  useFeatureFlags: () => ({
    checkFeatureFlag: (flag: string) =>
      flag === "applyFormPrototypeOff" ? mockApplyFormPrototypeOff : false,
  }),
}));

jest.mock("src/services/event/postUserEvent", () => ({
  postUserEvent: jest.fn(),
}));

jest.mock(
  "src/app/[locale]/(base)/opportunity/[id]/_components/StartApplicationModal/StartApplicationModalControl",
  () => ({
    StartApplicationModalControl: ({
      competitionId,
    }: {
      competitionId: string;
    }) => <button type="button">start application {competitionId}</button>,
  }),
);

const competition = (
  id: string,
  {
    has_open_date = false,
    is_legacy_package = false,
    is_open = false,
  }: Partial<
    Pick<Competition, "has_open_date" | "is_legacy_package" | "is_open">
  > = {},
) =>
  ({
    competition_id: id,
    has_open_date,
    is_legacy_package,
    is_open,
  }) as Competition;

const openSimplerCompetition = (id: string) =>
  competition(id, { has_open_date: true, is_open: true });

const renderApplyAction = ({
  competitions = null,
  legacyOpportunityId = 1,
  opportunityStatus = "posted",
  opportunityTitle = "Test Opportunity",
}: {
  competitions?: Competition[] | null;
  legacyOpportunityId?: number;
  opportunityStatus?: OpportunityStatus | null;
  opportunityTitle?: string | null;
} = {}) =>
  render(
    <OpportunityApplyAction
      competitions={competitions}
      grantsGovUrl="https://test.grants.gov/search-results-detail/1"
      legacyOpportunityId={legacyOpportunityId}
      opportunityId="test-opportunity-id"
      opportunityStatus={opportunityStatus}
      opportunityTitle={opportunityTitle}
    />,
  );

describe("OpportunityApplyAction", () => {
  afterEach(() => {
    mockApplyFormPrototypeOff = false;
  });

  it("links to apply on Grants.gov for an open opportunity with no competition open on Simpler", () => {
    renderApplyAction({ competitions: [competition("closed-comp")] });

    const link = screen.getByRole("link", { name: "applyOnGrantsGov" });
    expect(link).toHaveAttribute(
      "href",
      "https://test.grants.gov/search-results-detail/1",
    );
    expect(link).toHaveAttribute("target", "_blank");
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("offers starting an application instead when a competition is open on Simpler", () => {
    renderApplyAction({
      competitions: [
        competition("closed-comp"),
        openSimplerCompetition("open-comp"),
      ],
    });

    expect(
      screen.getByRole("button", { name: "start application open-comp" }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });

  it("offers starting an application when a competition is open on Simpler, even if the opportunity has no status", () => {
    renderApplyAction({
      competitions: [openSimplerCompetition("open-comp")],
      opportunityStatus: null,
    });

    expect(
      screen.getByRole("button", { name: "start application open-comp" }),
    ).toBeInTheDocument();
  });

  describe("package only opportunities, which have no status", () => {
    it("links to apply on Grants.gov when a Grants.gov package is within its application window", () => {
      renderApplyAction({
        competitions: [
          competition("grants-gov-package", {
            has_open_date: true,
            is_legacy_package: true,
          }),
        ],
        opportunityStatus: null,
      });

      expect(
        screen.getByRole("link", { name: "applyOnGrantsGov" }),
      ).toHaveAttribute(
        "href",
        "https://test.grants.gov/search-results-detail/1",
      );
      expect(screen.queryByRole("button")).not.toBeInTheDocument();
    });

    it("shows no call to action when the Grants.gov package is closed", () => {
      const { container } = renderApplyAction({
        competitions: [
          competition("grants-gov-package", { is_legacy_package: true }),
        ],
        opportunityStatus: null,
      });

      expect(container).toBeEmptyDOMElement();
    });

    it("does not link to Grants.gov for a competition that was created on Simpler, even if it is within its application window", () => {
      const { container } = renderApplyAction({
        competitions: [competition("simpler-comp", { has_open_date: true })],
        opportunityStatus: null,
      });

      expect(container).toBeEmptyDOMElement();
    });

    it("does not link to Grants.gov when there is no Grants.gov opportunity to link to", () => {
      const { container } = renderApplyAction({
        competitions: [
          competition("grants-gov-package", {
            has_open_date: true,
            is_legacy_package: true,
          }),
        ],
        // the type doesn't reflect that the API returns null for opportunities created on Simpler
        legacyOpportunityId: null as unknown as number,
        opportunityStatus: null,
      });

      expect(container).toBeEmptyDOMElement();
    });

    it("offers starting an application for a Grants.gov package that is also open on Simpler", () => {
      renderApplyAction({
        competitions: [
          competition("grants-gov-package", {
            has_open_date: true,
            is_legacy_package: true,
            is_open: true,
          }),
        ],
        opportunityStatus: null,
      });

      expect(
        screen.getByRole("button", {
          name: "start application grants-gov-package",
        }),
      ).toBeInTheDocument();
      expect(screen.queryByRole("link")).not.toBeInTheDocument();
    });

    it("falls back to Grants.gov for that package when applying on Simpler is turned off", () => {
      mockApplyFormPrototypeOff = true;
      renderApplyAction({
        competitions: [
          competition("grants-gov-package", {
            has_open_date: true,
            is_legacy_package: true,
            is_open: true,
          }),
        ],
        opportunityStatus: null,
      });

      expect(
        screen.getByRole("link", { name: "applyOnGrantsGov" }),
      ).toBeInTheDocument();
      expect(screen.queryByRole("button")).not.toBeInTheDocument();
    });
  });

  it("falls back to Grants.gov when applying on Simpler is turned off", () => {
    mockApplyFormPrototypeOff = true;
    renderApplyAction({ competitions: [openSimplerCompetition("open-comp")] });

    expect(
      screen.getByRole("link", { name: "applyOnGrantsGov" }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it.each<OpportunityStatus | null>(["forecasted", "closed", "archived", null])(
    "shows no call to action for a %s opportunity without an open competition",
    (opportunityStatus) => {
      const { container } = renderApplyAction({ opportunityStatus });
      expect(container).toBeEmptyDOMElement();
    },
  );
});

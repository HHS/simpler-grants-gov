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

const competition = (id: string, is_open: boolean) =>
  ({ competition_id: id, is_open }) as Competition;

const renderApplyAction = ({
  competitions = null,
  opportunityStatus = "posted",
  opportunityTitle = "Test Opportunity",
}: {
  competitions?: Competition[] | null;
  opportunityStatus?: OpportunityStatus | null;
  opportunityTitle?: string | null;
} = {}) =>
  render(
    <OpportunityApplyAction
      competitions={competitions}
      grantsGovUrl="https://test.grants.gov/search-results-detail/1"
      legacyOpportunityId={1}
      opportunityStatus={opportunityStatus}
      opportunityTitle={opportunityTitle}
    />,
  );

describe("OpportunityApplyAction", () => {
  afterEach(() => {
    mockApplyFormPrototypeOff = false;
  });

  it("links to apply on Grants.gov for an open opportunity with no competition open on Simpler", () => {
    renderApplyAction({ competitions: [competition("closed-comp", false)] });

    const link = screen.getByRole("link", {
      name: "applyOnGrantsGov opensInNewTab",
    });
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
        competition("closed-comp", false),
        competition("open-comp", true),
      ],
    });

    expect(
      screen.getByRole("button", { name: "start application open-comp" }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });

  it("offers starting an application for a package only opportunity, which has no status", () => {
    renderApplyAction({
      competitions: [competition("open-comp", true)],
      opportunityStatus: null,
    });

    expect(
      screen.getByRole("button", { name: "start application open-comp" }),
    ).toBeInTheDocument();
  });

  it("falls back to Grants.gov when applying on Simpler is turned off", () => {
    mockApplyFormPrototypeOff = true;
    renderApplyAction({ competitions: [competition("open-comp", true)] });

    expect(
      screen.getByRole("link", { name: "applyOnGrantsGov opensInNewTab" }),
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

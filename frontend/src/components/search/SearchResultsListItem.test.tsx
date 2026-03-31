import { render, screen, waitFor } from "@testing-library/react";
import { axe } from "jest-axe";
import { mockOpportunity } from "src/utils/testing/fixtures";

import SearchResultsListItem from "./SearchResultsListItem";

describe("SearchResultsListItem", () => {
  it("should not have basic accessibility issues", async () => {
    const { container } = render(
      <SearchResultsListItem index={1} opportunity={mockOpportunity} />,
    );
    const results = await waitFor(() => axe(container));
    expect(results).toHaveNoViolations();
  });

  it("renders opportunity title and number", () => {
    render(<SearchResultsListItem index={1} opportunity={mockOpportunity} />);

    expect(
      screen.getByRole("link", { name: /Test Opportunity/i }),
    ).toBeInTheDocument();
    expect(screen.getByText("OPP-12345")).toBeInTheDocument();
  });

  it("renders share with opportunity button when showShareButton is true", () => {
    render(
      <SearchResultsListItem
        index={1}
        opportunity={mockOpportunity}
        showShareButton={true}
        onShareClick={jest.fn()}
      />,
    );

    expect(
      screen.getByTestId("share-opportunity-button-id"),
    ).toBeInTheDocument();
  });

  it("does not render share with opportunity button when showShareButton is false", () => {
    render(
      <SearchResultsListItem
        index={1}
        opportunity={mockOpportunity}
        showShareButton={false}
        onShareClick={jest.fn()}
      />,
    );

    expect(
      screen.queryByTestId("share-opportunity-button-id"),
    ).not.toBeInTheDocument();
  });

  getDateTestCases().forEach(({ apiDate, uiDate }) => {
    it(`renders formatted date ${uiDate} for API date ${apiDate}`, () => {
      const opportunityWithDate = {
        ...mockOpportunity,
        summary: {
          ...mockOpportunity.summary,
          post_date: apiDate,
        },
      };

      render(
        <SearchResultsListItem index={1} opportunity={opportunityWithDate} />,
      );
      expect(screen.getByText(uiDate)).toBeInTheDocument();
    });
  });
});

function getDateTestCases() {
  return [
    { apiDate: "2024-05-01", uiDate: "May 1, 2024" },
    { apiDate: "2023-07-21", uiDate: "July 21, 2023" },
    { apiDate: "2022-11-30", uiDate: "November 30, 2022" },
    { apiDate: "2021-01-15", uiDate: "January 15, 2021" },
    { apiDate: "2020-06-17", uiDate: "June 17, 2020" },
    { apiDate: "2019-08-25", uiDate: "August 25, 2019" },
    { apiDate: "2018-12-05", uiDate: "December 5, 2018" },
    { apiDate: "2017-09-13", uiDate: "September 13, 2017" },
    { apiDate: "2016-04-07", uiDate: "April 7, 2016" },
    { apiDate: "2015-03-23", uiDate: "March 23, 2015" },
  ];
}

import { render, screen, within } from "@testing-library/react";

import {
  applicantTypesToGroups,
  OpportunityEligibility,
} from "src/components/opportunity/OpportunityEligibility";

const fakeApplicantTypes = [
  "state_governments",
  "nonprofits_non_higher_education_with_501c3",
];

describe("OpportunityEligibility", () => {
  it("renders the eligible applicant types with mapped values", () => {
    render(<OpportunityEligibility applicantTypes={fakeApplicantTypes} />);

    const governmentsHeading = screen.getByText("Government");
    const nonprofitHeading = screen.getByText("Nonprofit");

    expect(screen.getAllByRole("listitem")).toHaveLength(2);

    expect(governmentsHeading).toBeInTheDocument();
    // eslint-disable-next-line testing-library/no-node-access
    expect(governmentsHeading.parentElement).toBeDefined();
    expect(
      // eslint-disable-next-line testing-library/no-node-access
      within(governmentsHeading.parentElement || new HTMLElement()).getByText(
        "State governments",
      ),
    ).toBeInTheDocument();

    expect(nonprofitHeading).toBeInTheDocument();
    // eslint-disable-next-line testing-library/no-node-access
    expect(nonprofitHeading.parentElement).toBeDefined();

    expect(
      // eslint-disable-next-line testing-library/no-node-access
      within(nonprofitHeading.parentElement || new HTMLElement()).getByText(
        "Nonprofits non-higher education with 501(c)(3)",
      ),
    ).toBeInTheDocument();
  });

  it("deals with unknown types", () => {
    render(
      <OpportunityEligibility
        applicantTypes={[...fakeApplicantTypes, "unknown_type"]}
      />,
    );

    expect(screen.getAllByRole("listitem")).toHaveLength(2);
  });
});

describe("applicantTypesToGroups", () => {
  it("returns correctly formatted object mapping applicant type display values into groups", () => {
    expect(
      applicantTypesToGroups([
        ...fakeApplicantTypes,
        "independent_school_districts",
        "individuals",
        "small_businesses",
      ]),
    ).toEqual({
      government: ["State governments"],
      education: ["Independent school districts"],
      business: ["Small businesses"],
      miscellaneous: ["Individuals"],
      nonprofit: ["Nonprofits non-higher education with 501(c)(3)"],
    });
  });
  it("deals with unknown types", () => {
    expect(
      applicantTypesToGroups([
        ...fakeApplicantTypes,
        "independent_school_districts",
        "individuals",
        "small_businesses",
        "unknown_type",
      ]),
    ).toEqual({
      government: ["State governments"],
      education: ["Independent school districts"],
      business: ["Small businesses"],
      miscellaneous: ["Individuals"],
      nonprofit: ["Nonprofits non-higher education with 501(c)(3)"],
    });
  });
});

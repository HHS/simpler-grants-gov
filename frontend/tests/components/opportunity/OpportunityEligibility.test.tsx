import { render, screen } from "@testing-library/react";

import {
  applicantTypesToGroups,
  OpportunityEligibility,
} from "src/components/opportunity/OpportunityEligibility";

const fakeApplicantTypes = [
  "state_governments",
  "nonprofits_non_higher_education_with_501c3",
];

describe("OpportunityEligibility", () => {
  it("renders the eligible applicants with mapped values", () => {
    render(<OpportunityEligibility applicantTypes={fakeApplicantTypes} />);

    expect(screen.getAllByRole("listitem")).toHaveLength(2);
    expect(screen.getByText("State governments")).toBeInTheDocument();
    expect(
      screen.getByText("Nonprofits non-higher education with 501(c)(3)"),
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

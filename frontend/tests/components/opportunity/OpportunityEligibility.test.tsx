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
    expect(screen.getByText("State Governments")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Nonprofits without 501(c)(3), other than institutions of higher education",
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
      government: ["State Governments"],
      education: ["Independent School Districts"],
      business: ["Small Businesses"],
      miscellaneous: ["Individuals"],
      nonprofit: [
        "Nonprofits without 501(c)(3), other than institutions of higher education",
      ],
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
      government: ["State Governments"],
      education: ["Independent School Districts"],
      business: ["Small Businesses"],
      miscellaneous: ["Individuals"],
      nonprofit: [
        "Nonprofits without 501(c)(3), other than institutions of higher education",
      ],
    });
  });
});

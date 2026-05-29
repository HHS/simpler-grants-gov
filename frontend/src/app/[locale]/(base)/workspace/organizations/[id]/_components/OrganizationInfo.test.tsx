import { render, screen } from "@testing-library/react";
import { OrganizationInfo } from "src/app/[locale]/(base)/workspace/organizations/[id]/_components/OrganizationInfo";
import { fakeOrganizationDetailsResponse } from "src/utils/testing/fixtures";

describe("OragnizationInfo", () => {
  it("displays all necessary organization data", () => {
    render(
      <OrganizationInfo
        organizationDetails={fakeOrganizationDetailsResponse.sam_gov_entity}
      />,
    );

    expect(
      screen.getByText(
        `${fakeOrganizationDetailsResponse.sam_gov_entity.ebiz_poc_first_name} ${fakeOrganizationDetailsResponse.sam_gov_entity.ebiz_poc_last_name}`,
      ),
    ).toBeInTheDocument();

    expect(
      screen.getByText(
        fakeOrganizationDetailsResponse.sam_gov_entity.ebiz_poc_email,
      ),
    ).toBeInTheDocument();

    expect(
      screen.getByText(fakeOrganizationDetailsResponse.sam_gov_entity.uei),
    ).toBeInTheDocument();

    expect(
      screen.getByText(
        fakeOrganizationDetailsResponse.sam_gov_entity.expiration_date,
      ),
    ).toBeInTheDocument();
  });
});

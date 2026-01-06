import { render, screen } from "@testing-library/react";
import { fakeOrganizationDetailsResponse } from "src/utils/testing/fixtures";

import { OrganizationInfo } from "src/components/organization/OrganizationInfo";

describe("OrganizationInfo", () => {
  it("displays all necessary organization data", () => {
    const entity = fakeOrganizationDetailsResponse.sam_gov_entity;

    render(<OrganizationInfo organizationDetails={entity} />);

    expect(
      screen.getByText(
        `${entity.ebiz_poc_first_name} ${entity.ebiz_poc_last_name}`,
      ),
    ).toBeInTheDocument();

    expect(screen.getByText(entity.ebiz_poc_email)).toBeInTheDocument();
    expect(screen.getByText(entity.uei)).toBeInTheDocument();
    expect(screen.getByText(entity.expiration_date)).toBeInTheDocument();
  });

  it("renders the SAM.gov link", () => {
    render(
      <OrganizationInfo
        organizationDetails={fakeOrganizationDetailsResponse.sam_gov_entity}
      />,
    );

    const link = screen.getByRole("link", { name: "sam.gov" });
    expect(link).toHaveAttribute("href", "https://sam.gov");
    expect(link).toHaveAttribute("target", "_blank");
  });
});

import { render, screen } from "@testing-library/react";

import GrantsIdentifier from "src/components/GrantsIdentifier";

const identifier_strings = {
  identity:
    "An official website of the <hhsLink>U.S. Department of Health and Human Services</hhsLink>",
  gov_content:
    "Looking for U.S. government information and services? Visit <usaLink>USA.gov</usaLink>",
  link_about: "About HHS",
  link_accessibility: "Accessibility support",
  link_foia: "FOIA requests",
  link_fear: "EEO/No Fear Act",
  link_ig: "Office of the Inspector General",
  link_performance: "Performance reports",
  link_privacy: "Privacy Policy",
  logo_alt: "HHS logo",
};

describe("Identifier section", () => {
  it("Renders without errors", () => {
    render(<GrantsIdentifier identifier_strings={identifier_strings} />);
    const identifier = screen.getByTestId("identifier");
    expect(identifier).toBeInTheDocument();
  });
});

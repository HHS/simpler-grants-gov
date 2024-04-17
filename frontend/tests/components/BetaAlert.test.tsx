import { render, screen } from "@testing-library/react";

import BetaAlert from "src/components/BetaAlert";

const beta_strings = {
  alert_title: "Attention! Go to <LinkToGrants>www.grants.gov</LinkToGrants> to search and apply for grants.",
  alert: "Simpler.Grants.gov is a work in progress. Thank you for your patience as we build this new website."
};

describe("BetaAlert", () => {
  it("Renders without errors", () => {
    render(<BetaAlert beta_strings={beta_strings} />);
    const hero = screen.getByTestId("beta-alert");
    expect(hero).toBeInTheDocument();
  });
});

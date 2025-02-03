import { render, screen } from "tests/react-utils";

import BetaAlert from "src/components/BetaAlert";

describe("BetaAlert", () => {
  it("Renders without errors", () => {
    render(<BetaAlert />);
    const hero = screen.getByTestId("beta-alert");
    expect(hero).toBeInTheDocument();
  });

  it("overrides default messaging when specified", () => {
    render(
      <BetaAlert
        heading="THIS HEADERING"
        alertMessage="please display my beta alert message"
      />,
    );

    const heading = screen.getByRole("heading");
    expect(heading).toHaveTextContent("THIS HEADERING");

    const alertMessage = screen.getByRole("paragraph");
    expect(alertMessage).toHaveTextContent(
      "please display my beta alert message",
    );
  });
});

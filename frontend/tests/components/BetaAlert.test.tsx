import { render, screen } from "tests/react-utils";

import BetaAlert from "src/components/BetaAlert";

describe("BetaAlert", () => {
  it("Renders without errors", () => {
    render(<BetaAlert />);
    const hero = screen.getByTestId("beta-alert");
    expect(hero).toBeInTheDocument();
  });
});

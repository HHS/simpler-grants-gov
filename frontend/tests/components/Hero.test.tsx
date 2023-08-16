import { render, screen } from "@testing-library/react";

import Hero from "src/components/Hero";

describe("Alert", () => {
  it("Renders without errors", () => {
    render(<Hero />);
    const hero = screen.getByTestId("hero");
    expect(hero).toBeInTheDocument();
  });
});

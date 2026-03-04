import { render, screen } from "@testing-library/react";
import EventsHero from "src/app/[locale]/(base)/events/EventsHero";

describe("Events Hero Content", () => {
  it("Renders without errors", () => {
    render(<EventsHero />);
    const H1 = screen.getByRole("heading", {
      name: /header/i,
    });

    expect(H1).toBeInTheDocument();
  });
});

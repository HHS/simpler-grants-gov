import EventsHero from "src/app/[locale]/(base)/events/EventsHero";
import { render, screen } from "tests/react-utils";

describe("Events Hero Content", () => {
  it("renders the hero heading", () => {
    render(<EventsHero />);

    expect(
      screen.getByText(/be a part of the journey/i),
    ).toBeInTheDocument();
  });
});
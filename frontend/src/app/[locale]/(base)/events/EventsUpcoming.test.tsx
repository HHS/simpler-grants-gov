import EventsUpcoming from "src/app/[locale]/(base)/events/EventsUpcoming";
import { render, screen } from "tests/react-utils";

describe("Events Upcoming Content", () => {
  it("Renders without errors", () => {
    render(<EventsUpcoming />);
    const H1 = screen.getByRole("heading", {
      name: /Upcoming Events/i,
    });

    expect(H1).toBeInTheDocument();
  });
});

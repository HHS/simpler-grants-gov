import { render, screen } from "@testing-library/react";
import EventsUpcoming from "src/app/[locale]/(base)/events/EventsUpcoming";

describe("Events Upcoming Content", () => {
  it("Renders without errors", () => {
    render(<EventsUpcoming />);
    const H1 = screen.getByRole("heading", {
      name: "title",
    });

    expect(H1).toBeInTheDocument();
  });
});

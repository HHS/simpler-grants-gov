import { render, screen } from "@testing-library/react";
import EventsDemo from "src/app/[locale]/(base)/events/EventsDemo";

describe("Events demo Content", () => {
  it("Renders without errors", () => {
    render(<EventsDemo />);
    const component = screen.getByTestId("events-demo-content");

    expect(component).toBeInTheDocument();
  });
});

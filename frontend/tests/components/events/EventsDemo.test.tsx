import EventsDemo from "src/app/[locale]/(base)/events/EventsDemo";
import { render, screen } from "tests/react-utils";

describe("Events demo Content", () => {
  it("Renders without errors", () => {
    render(<EventsDemo />);
    const component = screen.getByTestId("events-demo-content");

    expect(component).toBeInTheDocument();
  });
});

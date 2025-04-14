import EventsCoding from "src/app/[locale]/events/EventsCoding";
import { render, screen } from "tests/react-utils";

describe("Events coding Content", () => {
  it("Renders without errors", () => {
    render(<EventsCoding />);
    const component = screen.getByTestId("events-coding-content");

    expect(component).toBeInTheDocument();
  });
});

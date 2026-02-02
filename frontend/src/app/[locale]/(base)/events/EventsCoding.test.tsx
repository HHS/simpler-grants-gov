import EventsCoding from "src/app/[locale]/(base)/events/EventsCoding";
import { render, screen } from "tests/react-utils";

describe("Events coding Content", () => {
  it("Renders without errors", () => {
    render(<EventsCoding />);
    const component = screen.getByTestId("events-coding-content");

    expect(component).toBeInTheDocument();
  });
});

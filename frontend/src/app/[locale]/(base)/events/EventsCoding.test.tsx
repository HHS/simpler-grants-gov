import { render, screen } from "@testing-library/react";
import EventsCoding from "src/app/[locale]/(base)/events/EventsCoding";

describe("Events coding Content", () => {
  it("Renders without errors", () => {
    render(<EventsCoding />);
    const component = screen.getByTestId("events-coding-content");

    expect(component).toBeInTheDocument();
  });
});

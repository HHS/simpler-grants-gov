import { render, screen } from "tests/react-utils";

import EventsDemo from "./EventsDemo";

describe("EventsDemo", () => {
  it("renders the demo section and watch link", () => {
    render(<EventsDemo />);

    expect(
      screen.getByRole("heading", {
        level: 2,
        name: "Simpler.Grants.gov Big Demo",
      }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("link", {
        name: /January 15, 2025/i,
      }),
    ).toHaveAttribute(
      "href",
      "https://vimeo.com/1050177794/278fa78e0b?share=copy",
    );
  });
});

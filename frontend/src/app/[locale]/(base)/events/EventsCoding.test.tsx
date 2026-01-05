import EventsCoding from "./EventsCoding";
import { render, screen } from "tests/react-utils";

describe("EventsCoding", () => {
  it("renders the coding challenge section", () => {
    render(<EventsCoding />);

    expect(
      screen.getByRole("heading", {
        level: 2,
        name: "Collaborative Coding Challenge",
      }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("link", {
        name: /spring 2025 coding challenge/i,
      }),
    ).toHaveAttribute(
      "href",
      "https://wiki.simpler.grants.gov/get-involved/community-events/spring-2025-collaborative-coding-challenge",
    );
  });
});

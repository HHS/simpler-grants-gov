import EventsUpcoming from "./EventsUpcoming";
import { render, screen } from "tests/react-utils";

describe("EventsUpcoming", () => {
  it("renders upcoming events and sign-up link", () => {
    render(<EventsUpcoming />);

    expect(
      screen.getByRole("heading", { level: 2, name: /upcoming events/i }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("link", { name: /sign up/i }),
    ).toHaveAttribute(
      "href",
      "https://docs.google.com/forms/d/e/1FAIpQLSe3nyLxAIeky3bGydyvuZobrlEGdWrl0YaZBbVmsn7Pu6HhUw/viewform",
    );
  });
});
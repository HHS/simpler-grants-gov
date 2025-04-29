import {
  render,
  screen,
} from "tests/react-utils";

deimport EventsHero from "src/app/[locale]/events/EventsHero";

describe("Events Hero Content", () => {
  it("Renders without errors", () => {
    render(<EventsHero />);
    const H1 = screen.getByRole("heading", {
      name: /Events/i,
    });

    expect(H1).toBeInTheDocument();
  });
});

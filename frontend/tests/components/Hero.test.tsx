import Hero from "src/components/homepage/sections/HomepageHero";
import {
  render,
  screen,
} from "tests/react-utils";

describe("Hero", () => {
  it("Renders without errors", () => {
    render(<Hero />);
    const hero = screen.getByTestId("hero");
    expect(hero).toBeInTheDocument();
  });
});

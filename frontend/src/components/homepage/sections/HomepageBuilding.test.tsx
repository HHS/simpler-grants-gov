import { render, screen } from "tests/react-utils";
import HomepageBuilding from "./HomepageBuilding";
import { messages } from "src/i18n/messages/en";

describe("HomepageBuilding", () => {
  it("renders the section heading and paragraphs", () => {
    render(<HomepageBuilding />);

    expect(
      screen.getByRole("heading", { level: 2, name: /Building with you, not for you/i }),
    ).toBeInTheDocument();

    for (const paragraph of messages.Homepage.sections.building.paragraphs) {
      expect(screen.getByText(paragraph)).toBeInTheDocument();
    }
  });
});

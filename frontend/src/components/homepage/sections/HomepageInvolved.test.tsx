import { render, screen } from "tests/react-utils";
import HomepageInvolved from "./HomepageInvolved";
import { messages } from "src/i18n/messages/en";

describe("HomepageInvolved", () => {
  it("renders the section title and discourse link", () => {
    render(<HomepageInvolved />);

    expect(
      screen.getByRole("heading", {
        level: 2,
        name: messages.Homepage.sections.involved.title,
      }),
    ).toBeInTheDocument();

    const discourse = screen.getByRole("link", {
      name: messages.Homepage.sections.involved.discourseLink,
    });

    expect(discourse).toHaveAttribute("href", "https://forum.simpler.grants.gov/");
    expect(discourse).toHaveAttribute("target", "_blank");
  });
});

import { messages } from "src/i18n/messages/en";
import { render, screen } from "tests/react-utils";

import HomepageExperimental from "./HomepageExperimental";

describe("HomepageExperimental", () => {
  it("renders the section title and primary search CTA", () => {
    render(<HomepageExperimental />);

    expect(
      screen.getByRole("heading", {
        level: 2,
        name: messages.Homepage.sections.experimental.title,
      }),
    ).toBeInTheDocument();

    const button = screen.getByRole("button", {
      name: messages.Homepage.sections.experimental.tryLink,
    });

    const link = button.closest("a");
    expect(link).toHaveAttribute("href", "/search");
  });

  it("renders the feedback + newsletter links", () => {
    render(<HomepageExperimental />);

    expect(
      screen.getByRole("link", {
        name: messages.Homepage.sections.experimental.iconSections[0].link,
      }),
    ).toHaveAttribute(
      "href",
      messages.Homepage.sections.experimental.iconSections[0].http,
    );

    expect(
      screen.getByRole("link", {
        name: messages.Homepage.sections.experimental.iconSections[1].link,
      }),
    ).toHaveAttribute(
      "href",
      messages.Homepage.sections.experimental.iconSections[1].http,
    );
  });
});

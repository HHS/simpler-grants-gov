import ProcessNext, {
  gitHubLinkForIssue,
} from "src/app/[locale]/process/ProcessNext";
import { render, screen } from "tests/react-utils";

describe("Process Content", () => {
  it("Renders without errors", () => {
    render(<ProcessNext />);
    const ProcessH1 = screen.getByRole("heading", {
      level: 2,
      name: /What we're working on right now/i,
    });

    expect(ProcessH1).toBeInTheDocument();
  });
  it("gitHubLinkForIssue renders with correct link", () => {
    render(gitHubLinkForIssue(123)("link to important issue"));
    expect(
      screen.getByRole("link", { name: /link to important issue/i }),
    ).toHaveAttribute(
      "href",
      "https://github.com/HHS/simpler-grants-gov/issues/123",
    );
  });
});

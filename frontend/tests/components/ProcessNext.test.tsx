import ProcessNext, {
  gitHubIssueLink,
} from "src/app/[locale]/process/ProcessNext";
import { render, screen } from "tests/react-utils";

describe("Process Content", () => {
  it("Renders without errors", () => {
    render(<ProcessNext />);
    const ProcessH1 = screen.getByRole("heading", {
      level: 2,
      name: /What's happening/i,
    });

    expect(ProcessH1).toBeInTheDocument();
  });
  it("github link", () => {
    const link = gitHubIssueLink(123)("");
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    expect(link.props.href).toBe(
      "https://github.com/HHS/simpler-grants-gov/issues/123",
    );
  });
});

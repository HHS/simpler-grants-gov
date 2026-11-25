import { render, screen } from "@testing-library/react";

import { MarkdownDescription } from "./MarkdownDescription";

const renderText = (text: string) =>
  render(<MarkdownDescription text={text} />);

describe("MarkdownDescription", () => {
  it("renders one sentence as one paragraph", () => {
    renderText("Individual authorized to accept payments.");

    expect(screen.getByRole("paragraph")).toHaveTextContent(
      "Individual authorized to accept payments.",
    );
  });

  it("starts a paragraph after each blank line", () => {
    renderText("First paragraph.\n\nSecond paragraph.");

    expect(screen.getAllByRole("paragraph")).toHaveLength(2);
  });

  it("joins wrapped lines into one paragraph", () => {
    renderText("A sentence that\nwraps onto a second line.");

    expect(screen.getByRole("paragraph")).toHaveTextContent(
      "A sentence that wraps onto a second line.",
    );
  });

  it("renders numbered items separated by blank lines as one list", () => {
    renderText(
      "1. Has the legal authority to apply.\n\n2. Will give the agency access.\n\n3. Will establish safeguards.",
    );

    expect(screen.getAllByRole("list")).toHaveLength(1);
    expect(screen.getAllByRole("listitem")).toHaveLength(3);
  });

  it("continues a numbered list from its first number", () => {
    renderText("4. Will initiate the work.\n5. Will comply.");

    expect(screen.getByRole("list")).toHaveAttribute("start", "4");
  });

  it("joins a wrapped item's lines into one item", () => {
    renderText(
      "1. Has the legal authority to apply and the\ninstitutional capability.",
    );

    expect(screen.getByRole("listitem")).toHaveTextContent(
      "Has the legal authority to apply and the institutional capability.",
    );
  });

  it("renders bulleted items as an unordered list", () => {
    renderText("- First\n- Second");

    expect(screen.getByRole("list").tagName).toBe("UL");
    expect(screen.getAllByRole("listitem")).toHaveLength(2);
  });

  it("ends a list at a paragraph after a blank line", () => {
    renderText("1. Only item.\n\nClosing paragraph.");

    expect(screen.getAllByRole("listitem")).toHaveLength(1);
    expect(screen.getByRole("paragraph")).toHaveTextContent(
      "Closing paragraph.",
    );
  });

  it("renders a heading as a bold paragraph, so it stays out of the page outline", () => {
    renderText("# Part I\n\n## Definitions");

    expect(screen.queryByRole("heading")).not.toBeInTheDocument();
    expect(screen.getByText("Part I").tagName).toBe("STRONG");
    expect(screen.getByText("Definitions").tagName).toBe("STRONG");
  });

  it("renders bold text", () => {
    renderText("Read the **entire** statement.");

    expect(screen.getByText("entire").tagName).toBe("STRONG");
  });

  it("opens links in a new tab", () => {
    renderText("See [the instructions](https://www.grants.gov/forms).");

    const link = screen.getByRole("link", { name: "the instructions" });
    expect(link).toHaveAttribute("href", "https://www.grants.gov/forms");
    expect(link).toHaveAttribute("target", "_blank");
  });

  it("leaves asterisks followed by a space as written", () => {
    renderText("** The list of certifications is in the announcement.");

    expect(
      screen.getByText("** The list of certifications is in the announcement."),
    ).toBeInTheDocument();
  });

  it("drops script links", () => {
    renderText("[Click here](javascript:alert(1))");

    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });

  it("shows HTML as text", () => {
    renderText("<img src=x onerror=alert(1)> Read this.");

    expect(screen.queryByRole("img")).not.toBeInTheDocument();
    expect(
      screen.getByText("<img src=x onerror=alert(1)> Read this."),
    ).toBeInTheDocument();
  });
});

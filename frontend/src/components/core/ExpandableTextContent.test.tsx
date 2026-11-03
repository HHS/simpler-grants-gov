import { act, render, screen, waitFor } from "@testing-library/react";

import { ExpandableTextContent } from "src/components/core/ExpandableTextContent";

// long enough to exceed the default 750 character threshold, with closed tags
// and whitespace after the default 600 character split point so that
// splitMarkup returns a non empty remainder
const longTextContent = new Array(10)
  .fill(`<p>${"description ".repeat(10)}</p>`)
  .join("\n");
const shortTextContent = "<p>a short description</p>";

describe("ExpandableTextContent", () => {
  it("renders the ellipsis only while the remaining content is collapsed", async () => {
    const { container } = render(
      <ExpandableTextContent
        textContent={longTextContent}
        showCallToAction="show full description"
        hideCallToAction="hide full description"
      />,
    );

    expect(container).toHaveTextContent("...");

    const showButton = screen.getByText("show full description");
    act(() => {
      showButton.click();
    });

    await waitFor(() => {
      expect(container).not.toHaveTextContent("...");
    });

    const hideButton = screen.getByText("hide full description");
    act(() => {
      hideButton.click();
    });

    await waitFor(() => {
      expect(container).toHaveTextContent("...");
    });
  });

  it("does not render an ellipsis or a toggle for content below the split threshold", () => {
    const { container } = render(
      <ExpandableTextContent
        textContent={shortTextContent}
        showCallToAction="show full description"
        hideCallToAction="hide full description"
      />,
    );

    expect(container).toHaveTextContent("a short description");
    expect(container).not.toHaveTextContent("...");
    expect(
      screen.queryByTestId("content-display-toggle"),
    ).not.toBeInTheDocument();
  });
});

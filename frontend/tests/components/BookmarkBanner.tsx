import { render, screen } from "tests/react-utils";

import BookmarkBanner from "src/components/BookmarkBanner";

describe("BookmarkBanner", () => {
  it("Renders without crashing", () => {
    render(<BookmarkBanner />);
    const banner = screen.getByTestId("bookmark-banner");
    expect(banner).toBeInTheDocument();
  });
});

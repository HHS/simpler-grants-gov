import { render, screen } from "tests/react-utils";

import BookmarkBanner from "src/components/BookmarkBanner";

describe("BookmarkBanner", () => {
  it("Renders without crashing", () => {
    render(<BookmarkBanner />);
    const banner = screen.getByTestId("bookmark-banner");
    expect(banner).toBeInTheDocument();
  });

  it("renders message prop when specified", () => {
    const expectedBannerMessage = "bookmark me";
    render(<BookmarkBanner message={expectedBannerMessage} />);
    const bannerMessage = screen.getByRole("paragraph");
    expect(bannerMessage).toHaveTextContent(expectedBannerMessage);
  });
});

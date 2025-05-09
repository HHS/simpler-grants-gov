import { render, screen } from "tests/react-utils";

import ZipDownloadButton from "src/components/opportunity/ZipDownloadButton";

const ZipDownloadButtonProps = {
  opportunityId: 87,
};

describe("ZipDownloadButton", () => {
  it("Renders without errors", () => {
    render(<ZipDownloadButton {...ZipDownloadButtonProps} />);
    const zipDownloadButton = screen.getByRole("button");
    expect(zipDownloadButton).toBeInTheDocument();
    expect(zipDownloadButton).toHaveTextContent("Download all");
  });
});

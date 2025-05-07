import { render, screen } from "tests/react-utils";

import ZipDownloadButton from "src/components/opportunity/ZipDownloadButton";

const ZipDownloadButtonProps = {
  opportunityId: 87,
  testId: `opportunity-document-button`,
};

describe("ZipDownloadButton", () => {
  it("Renders without errors", () => {
    render(<ZipDownloadButton {...ZipDownloadButtonProps} />);
    const zipDownloadButton = screen.getByTestId(`opportunity-document-button`);
    expect(zipDownloadButton).toBeInTheDocument();
    expect(zipDownloadButton).toHaveTextContent("Download all");
  });
});

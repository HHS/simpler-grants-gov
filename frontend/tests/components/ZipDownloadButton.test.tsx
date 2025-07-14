import userEvent from "@testing-library/user-event";
import { buildPathToZipDownload as orgBuiltPathToZipDownload } from "src/utils/opportunity/zipDownloadUtils";
import { render, screen } from "tests/react-utils";

import ZipDownloadButton from "src/components/opportunity/ZipDownloadButton";

const ZipDownloadButtonProps = {
  opportunityId: "63588df8-f2d1-44ed-a201-5804abba696a",
};

const downloadAttachmentsZipMock = jest.fn();
jest.mock("src/utils/opportunity/zipDownloadUtils", (): unknown => ({
  ...jest.requireActual("src/utils/opportunity/zipDownloadUtils"),
  downloadAttachmentsZip: (...args: unknown[]): unknown =>
    downloadAttachmentsZipMock(...args),
}));

describe("ZipDownloadButton", () => {
  it("Renders without errors", () => {
    render(<ZipDownloadButton {...ZipDownloadButtonProps} />);
    const zipDownloadButton = screen.getByRole("button");
    expect(zipDownloadButton).toBeInTheDocument();
    expect(zipDownloadButton).toHaveTextContent("Download all");
  });

  it("Calls downloadAttachmentsZip on click", async () => {
    render(<ZipDownloadButton {...ZipDownloadButtonProps} />);
    const zipDownloadButton = screen.getByRole("button");
    await userEvent.click(zipDownloadButton);

    expect(downloadAttachmentsZipMock).toHaveBeenCalledTimes(1);
    expect(downloadAttachmentsZipMock).toHaveBeenCalledWith(
      ZipDownloadButtonProps.opportunityId,
    );
  });

  it("Generates correct zip download URLs", () => {
    const url = orgBuiltPathToZipDownload(ZipDownloadButtonProps.opportunityId);
    expect(url).toEqual(
      `/api/opportunities/${ZipDownloadButtonProps.opportunityId}/attachments-download`,
    );
  });
});

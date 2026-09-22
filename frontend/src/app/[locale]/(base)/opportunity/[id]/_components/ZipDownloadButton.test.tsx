import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { buildPathToZipDownload as orgBuiltPathToZipDownload } from "src/utils/opportunity/zipDownloadUtils";

import ZipDownloadButton from "./ZipDownloadButton";

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
    expect(zipDownloadButton).toHaveTextContent("zipDownload");
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

  it("sends a user event beacon on click", async () => {
    const sendBeaconMock = jest.fn();
    Object.defineProperty(navigator, "sendBeacon", {
      value: sendBeaconMock,
      writable: true,
    });

    render(<ZipDownloadButton {...ZipDownloadButtonProps} />);
    await userEvent.click(screen.getByRole("button"));

    expect(sendBeaconMock).toHaveBeenCalledTimes(1);
    const [url, blob] = sendBeaconMock.mock.calls[0] as [string, Blob];
    expect(url).toBe("/api/events");
    const blobText = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error("failed to read blob"));
      reader.readAsText(blob);
    });
    expect(JSON.parse(blobText)).toEqual({
      name: "click_download_opportunity_documents_zip",
      properties: { opportunityId: ZipDownloadButtonProps.opportunityId },
    });
  });
});

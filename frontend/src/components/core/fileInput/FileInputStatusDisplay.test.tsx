import { render, screen } from "@testing-library/react";

import { FileInputStatusDisplay } from "./FileInputStatusDisplay";

describe("FileInputStatusDisplay", () => {
  it("does not display if status is undefined", () => {
    render(
      <FileInputStatusDisplay
        error={false}
        status={undefined}
        postUploadActionProgressMessage={""}
        postUploadActionSuccessMessage={""}
        postUploadActionErrorMessage={""}
      />,
    );
    expect(
      screen.queryByTestId("file-upload-status-display"),
    ).not.toBeInTheDocument();
  });
  it("displays progress status if in progress", () => {
    render(
      <FileInputStatusDisplay
        error={false}
        status={"uploading"}
        postUploadActionProgressMessage={""}
        postUploadActionSuccessMessage={""}
        postUploadActionErrorMessage={""}
      />,
    );
    expect(screen.getByTestId("file-upload-status-display")).toHaveTextContent(
      "uploading",
    );
  });
  it("displays error message when relevant", () => {
    render(
      <FileInputStatusDisplay
        error={true}
        status={"uploading"}
        postUploadActionProgressMessage={""}
        postUploadActionSuccessMessage={""}
        postUploadActionErrorMessage={"post upload error"}
      />,
    );
    expect(screen.getByTestId("file-upload-status-display")).toHaveTextContent(
      "uploadError",
    );
  });
  it("displays postUploadActionProgressMessage while performing post upload action", () => {
    render(
      <FileInputStatusDisplay
        error={false}
        status={"post-upload"}
        postUploadActionProgressMessage={"post upload message"}
        postUploadActionSuccessMessage={""}
        postUploadActionErrorMessage={""}
      />,
    );
    expect(screen.getByTestId("file-upload-status-display")).toHaveTextContent(
      "post upload message",
    );
  });
  it("displays postUploadActionSuccessMessage after successful post upload action", () => {
    render(
      <FileInputStatusDisplay
        error={false}
        status={"complete"}
        postUploadActionProgressMessage={""}
        postUploadActionSuccessMessage={"post upload success"}
        postUploadActionErrorMessage={""}
      />,
    );
    expect(screen.getByTestId("file-upload-status-display")).toHaveTextContent(
      "post upload success",
    );
  });
  it("displays postUploadActionErrorMessage on failed post upload action", () => {
    render(
      <FileInputStatusDisplay
        error={true}
        status={"post-upload"}
        postUploadActionProgressMessage={""}
        postUploadActionSuccessMessage={""}
        postUploadActionErrorMessage={"post upload error"}
      />,
    );
    expect(screen.getByTestId("file-upload-status-display")).toHaveTextContent(
      "post upload error",
    );
  });
});

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { FileInputStatusDisplay } from "./FileInputStatusDisplay";

describe("FileInputStatusDisplay", () => {
  it("does not display if status is undefined", () => {
    render(
      <FileInputStatusDisplay
        onCancel={jest.fn()}
        onDismiss={jest.fn()}
        fileName="a_file.txt"
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
        onCancel={jest.fn()}
        onDismiss={jest.fn()}
        fileName="a_file.txt"
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
        onCancel={jest.fn()}
        onDismiss={jest.fn()}
        fileName="a_file.txt"
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
        onCancel={jest.fn()}
        onDismiss={jest.fn()}
        fileName="a_file.txt"
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
        onCancel={jest.fn()}
        onDismiss={jest.fn()}
        fileName="a_file.txt"
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
        onCancel={jest.fn()}
        onDismiss={jest.fn()}
        fileName="a_file.txt"
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

  it("calls onCancel callback on cancel button click", async () => {
    const onCancelMock = jest.fn();
    render(
      <FileInputStatusDisplay
        onCancel={onCancelMock}
        onDismiss={jest.fn()}
        fileName="a_file.txt"
        error={false}
        status={"uploading"}
        postUploadActionProgressMessage={""}
        postUploadActionSuccessMessage={""}
        postUploadActionErrorMessage={"post upload error"}
      />,
    );

    const cancelButton = screen.getByRole("button", { name: "cancel" });
    expect(cancelButton).toBeInTheDocument();

    await userEvent.click(cancelButton);
    expect(onCancelMock).toHaveBeenCalled();
  });
  it("calls onDismiss callback on dismiss button click", async () => {
    const onDismiss = jest.fn();
    render(
      <FileInputStatusDisplay
        onCancel={jest.fn()}
        onDismiss={onDismiss}
        fileName="a_file.txt"
        error={true}
        status={"uploading"}
        postUploadActionProgressMessage={""}
        postUploadActionSuccessMessage={""}
        postUploadActionErrorMessage={"post upload error"}
      />,
    );

    const cancelButton = screen.getByRole("button", { name: "dismiss" });
    expect(cancelButton).toBeInTheDocument();

    await userEvent.click(cancelButton);
    expect(onDismiss).toHaveBeenCalled();
  });
});

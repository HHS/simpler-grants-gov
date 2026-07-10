import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { DeleteFileModal } from "./DeleteFileModal";

const defaultProps = {
  deletePending: false,
  handleDeleteFile: jest.fn(),
  modalId: "delete-file-modal",
  modalRef: { current: null },
  pendingDeleteName: undefined,
};

describe("DeleteFileModal", () => {
  afterEach(() => {
    jest.resetAllMocks();
  });
  it("calls handleDeleteFile when clicking the delete button", async () => {
    const handleDeleteFile = jest.fn();
    render(
      <DeleteFileModal {...defaultProps} handleDeleteFile={handleDeleteFile} />,
    );

    const deleteButton = screen.getByRole("button", { name: "deleteFileCta" });
    expect(deleteButton).toBeInTheDocument();

    await userEvent.click(deleteButton);
    expect(handleDeleteFile).toHaveBeenCalledTimes(1);
  });
  it("disables the delete button when delete is pending", () => {
    render(<DeleteFileModal {...defaultProps} deletePending={true} />);

    const deleteButton = screen.getByRole("button", { name: "deleting" });
    expect(deleteButton).toBeDisabled();
  });
  it("displays the pendingDeleteName when provided", () => {
    render(
      <DeleteFileModal {...defaultProps} pendingDeleteName="my-file.pdf" />,
    );

    expect(screen.getByText("titleText my-file.pdf?")).toBeInTheDocument();
  });
  it("displays a generic caution title when no pendingDeleteName is provided", () => {
    render(<DeleteFileModal {...defaultProps} pendingDeleteName={undefined} />);

    expect(screen.getByText("cautionDeletingAttachment")).toBeInTheDocument();
  });
});

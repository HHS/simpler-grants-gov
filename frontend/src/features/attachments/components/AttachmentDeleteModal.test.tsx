/* eslint-disable import/first */
jest.mock("src/features/attachments/hooks/useAttachmentDelete");
jest.mock("src/features/attachments/context/AttachmentsContext");

import { fireEvent, render, screen } from "@testing-library/react";
import { useAttachmentsContext } from "src/features/attachments/context/AttachmentsContext";
import { useAttachmentDelete } from "src/features/attachments/hooks/useAttachmentDelete";

import React, { RefObject } from "react";
import { ModalRef } from "@trussworks/react-uswds";

import { AttachmentDeleteModal } from "./AttachmentDeleteModal";

const mockToggleModal = jest.fn();

const modalRef = {
  current: { toggleModal: mockToggleModal },
} as unknown as RefObject<ModalRef | null>;

const mockDeleteAttachment = jest.fn().mockResolvedValue(undefined);

const defaultMockCtx = {
  pendingDeleteId: "id-123",
  pendingDeleteName: "example.pdf",
  setDeletingIds: jest.fn(),
  closeDeleteModal: jest.fn(),
};

beforeEach(() => {
  jest.resetAllMocks();

  (useAttachmentDelete as jest.Mock).mockReturnValue({
    deleteAttachment: mockDeleteAttachment,
  });
});

describe("AttachmentDeleteModal", () => {
  it("renders modal with title and description", () => {
    (useAttachmentsContext as jest.Mock).mockReturnValue(defaultMockCtx);

    render(
      <AttachmentDeleteModal
        titleText="Delete"
        descriptionText="Are you sure?"
        cancelCtaText="Cancel"
        buttonCtaText="Yes, delete"
        modalId="delete-modal"
        modalRef={modalRef}
      />,
    );

    expect(screen.getByText("Delete example.pdf?")).toBeInTheDocument();
  });

  it("does not call deleteAttachment if pendingDeleteId is null", () => {
    (useAttachmentsContext as jest.Mock).mockReturnValue({
      ...defaultMockCtx,
      pendingDeleteId: null,
    });

    render(
      <AttachmentDeleteModal
        titleText="Delete"
        descriptionText="Are you sure?"
        cancelCtaText="Cancel"
        buttonCtaText="Yes, delete"
        modalId="delete-modal"
        modalRef={modalRef}
      />,
    );

    fireEvent.click(screen.getByText("Yes, delete"));
    expect(mockDeleteAttachment).not.toHaveBeenCalled();
  });

  // TODO: fix pendingId returns undefined
  // test("calls deleteAttachment and closes modal", () => {
  //   render(
  //     <AttachmentDeleteModal
  //       titleText="Delete"
  //       descriptionText="Are you sure?"
  //       cancelCtaText="Cancel"
  //       buttonCtaText="Delete"
  //       modalId="delete-modal"
  //       modalRef={modalRef as React.RefObject<ModalRef>}
  //     />,
  //   );

  //   fireEvent.click(screen.getByRole("button", { name: /delete/i }));

  //   expect(defaultMockCtx.pendingDeleteId).toHaveBeenCalledWith(
  //     expect.any(Function),
  //   );
  // });

  it("shows fallback title if pendingDeleteName is null", () => {
    (useAttachmentsContext as jest.Mock).mockReturnValue({
      ...defaultMockCtx,
      pendingDeleteName: null,
    });

    render(
      <AttachmentDeleteModal
        titleText="Delete"
        descriptionText="Are you sure?"
        cancelCtaText="Cancel"
        buttonCtaText="Yes, delete"
        modalId="delete-modal"
        modalRef={modalRef}
      />,
    );

    expect(
      screen.getByText("Caution, deleting attachment"),
    ).toBeInTheDocument();
  });
});

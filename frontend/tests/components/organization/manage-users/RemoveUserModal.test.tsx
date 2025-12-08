import { fireEvent, render, screen } from "@testing-library/react";

import React, { type RefObject } from "react";

import "@testing-library/jest-dom";

import type { ModalRef } from "@trussworks/react-uswds";

import { RemoveUserModal } from "src/components/manageUsers/RemoveUserModal";

type TranslationFunction = (key: string, values?: { name?: string }) => string;

const useTranslationsMock = jest.fn<TranslationFunction, [string]>(
  (_namespace: string) => (key: string, values?: { name?: string }) => {
    if (key === "description") {
      return `description for ${values?.name ?? ""}`;
    }
    return key;
  },
);

jest.mock("next-intl", () => ({
  useTranslations: (namespace: string) => useTranslationsMock(namespace),
}));

describe("RemoveUserModal", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders header, interpolated description, and buttons", () => {
    const modalReference: RefObject<ModalRef | null> = { current: null };
    const confirmHandler = jest.fn<void, []>();
    const cancelHandler = jest.fn<void, []>();

    render(
      <RemoveUserModal
        isSubmitting={false}
        modalRef={modalReference}
        userName="Ada Lovelace"
        onConfirm={confirmHandler}
        onCancel={cancelHandler}
      />,
    );

    expect(screen.getByText("header")).toBeVisible();
    expect(screen.getByText("description for Ada Lovelace")).toBeVisible();

    const confirmButton = screen.getByRole("button", {
      name: "removeUser",
    });
    const cancelButton = screen.getByRole("button", {
      name: "cancel",
    });

    expect(confirmButton).toBeEnabled();
    expect(cancelButton).toBeEnabled();

    fireEvent.click(confirmButton);
    expect(confirmHandler).toHaveBeenCalledTimes(1);
  });

  it("disables buttons and shows removing state when submitting", () => {
    const modalReference: RefObject<ModalRef | null> = { current: null };

    const { rerender } = render(
      <RemoveUserModal
        isSubmitting={false}
        modalRef={modalReference}
        userName="Ada Lovelace"
        onConfirm={jest.fn()}
        onCancel={jest.fn()}
      />,
    );

    expect(screen.getByRole("button", { name: "removeUser" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "cancel" })).toBeEnabled();

    rerender(
      <RemoveUserModal
        isSubmitting
        modalRef={modalReference}
        userName="Ada Lovelace"
        onConfirm={jest.fn()}
        onCancel={jest.fn()}
      />,
    );

    const submittingButton = screen.getByRole("button", {
      name: "removing",
    });
    const cancelButton = screen.getByRole("button", {
      name: "cancel",
    });

    expect(submittingButton).toBeDisabled();
    expect(cancelButton).toBeDisabled();
  });
});

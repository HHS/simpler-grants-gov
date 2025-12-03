import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import React from "react";

import "@testing-library/jest-dom";

import { RemoveUserButton } from "src/components/manageUsers/RemoveUserButton";

type TranslationFunction = (key: string, values?: { name?: string }) => string;

const useTranslationsMock = jest.fn<TranslationFunction, [string]>(
  (_namespace: string) => (key: string) => {
    return key;
  },
);

jest.mock("next-intl", () => ({
  useTranslations: (namespace: string) => useTranslationsMock(namespace),
}));

const routerRefreshMock = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh: routerRefreshMock,
  }),
}));

type ClientFetchFunction = (
  input: string,
  init?: RequestInit,
) => Promise<unknown>;

const clientFetchMock = jest.fn<
  ReturnType<ClientFetchFunction>,
  Parameters<ClientFetchFunction>
>();

jest.mock("src/hooks/useClientFetch", () => ({
  useClientFetch: (_defaultErrorMessage: string) => ({
    clientFetch: clientFetchMock,
  }),
}));

type RemoveUserModalProps = {
  isSubmitting: boolean;
  modalRef: React.RefObject<{ toggleModal: () => void } | null>;
  userName: string;
  onConfirm: () => void;
  onCancel: () => void;
};

const removeUserModalPropsMock = jest.fn<void, [RemoveUserModalProps]>();
const modalToggleMock = jest.fn();

jest.mock("src/components/manageUsers/RemoveUserModal", () => ({
  RemoveUserModal: (props: RemoveUserModalProps) => {
    removeUserModalPropsMock(props);

    const { isSubmitting, userName, onConfirm, onCancel } = props;
    if (isSubmitting && userName === "__never__") {
      onConfirm();
      onCancel();
    }

    if (!props.modalRef.current) {
      props.modalRef.current = {
        toggleModal: modalToggleMock,
      };
    }

    return <div data-testid="remove-user-modal" />;
  },
}));

describe("RemoveUserButton", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("opens the modal when the remove button is clicked", () => {
    render(
      <RemoveUserButton
        organizationId="org-123"
        userId="user-456"
        userName="Ada Lovelace"
      />,
    );

    const removeButton = screen.getByRole("button", {
      name: "removeUser",
    });

    fireEvent.click(removeButton);

    expect(modalToggleMock).toHaveBeenCalledTimes(1);
  });

  it("calls clientFetch, closes modal, and refreshes router when confirm is triggered", async () => {
    clientFetchMock.mockResolvedValueOnce({});

    render(
      <RemoveUserButton
        organizationId="org-123"
        userId="user-456"
        userName="Ada Lovelace"
      />,
    );

    const firstCall = removeUserModalPropsMock.mock.calls[0];
    const modalProps = firstCall[0];

    modalProps.onConfirm();

    await waitFor(() => {
      expect(clientFetchMock).toHaveBeenCalledTimes(1);
    });

    expect(clientFetchMock).toHaveBeenCalledWith(
      "/api/user/organizations/org-123/users/user-456",
      { method: "DELETE" },
    );

    expect(modalToggleMock).toHaveBeenCalled();
    expect(routerRefreshMock).toHaveBeenCalledTimes(1);

    const lastCall =
      removeUserModalPropsMock.mock.calls[
        removeUserModalPropsMock.mock.calls.length - 1
      ];
    expect(lastCall[0].isSubmitting).toBe(false);
  });

  it("does not close modal or refresh router when clientFetch throws, but still resets isSubmitting", async () => {
    clientFetchMock.mockRejectedValueOnce(
      new Error("network error during removal"),
    );

    render(
      <RemoveUserButton
        organizationId="org-123"
        userId="user-789"
        userName="Ada Lovelace"
      />,
    );

    const firstCall = removeUserModalPropsMock.mock.calls[0];
    const modalProps = firstCall[0];

    modalProps.onConfirm();

    await waitFor(() => {
      expect(clientFetchMock).toHaveBeenCalledTimes(1);
    });

    expect(clientFetchMock).toHaveBeenCalledWith(
      "/api/user/organizations/org-123/users/user-789",
      { method: "DELETE" },
    );

    expect(modalToggleMock).not.toHaveBeenCalled();
    expect(routerRefreshMock).not.toHaveBeenCalled();

    const lastCall =
      removeUserModalPropsMock.mock.calls[
        removeUserModalPropsMock.mock.calls.length - 1
      ];
    expect(lastCall[0].isSubmitting).toBe(false);
  });

  it("calls onCancel via the modal props and closes the modal", () => {
    render(
      <RemoveUserButton
        organizationId="org-123"
        userId="user-456"
        userName="Ada Lovelace"
      />,
    );

    const firstCall = removeUserModalPropsMock.mock.calls[0];
    const modalProps = firstCall[0];

    modalProps.onCancel();

    expect(modalToggleMock).toHaveBeenCalledTimes(1);
  });
});

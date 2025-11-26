import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import React from "react";

import "@testing-library/jest-dom";

import { useTranslationsMock } from "src/utils/testing/intlMocks";

import type { RoleChangeModalProps } from "src/components/manageUsers/RoleChangeModal";
import { RoleManager } from "src/components/manageUsers/RoleManager";

jest.mock("next-intl", () => ({
  useTranslations: () => useTranslationsMock(),
}));

let lastModalProps: RoleChangeModalProps | null = null;

jest.mock("src/components/manageUsers/RoleChangeModal", () => ({
  RoleChangeModal: (props: RoleChangeModalProps) => {
    lastModalProps = props;
    return <div data-testid="role-change-modal" />;
  },
}));

type ClientFetchArgs = [string, { method: string; body: string }];

const clientFetchMock = jest.fn<Promise<unknown>, ClientFetchArgs>();

jest.mock("src/hooks/useClientFetch", () => ({
  useClientFetch: (_message: string) => ({
    clientFetch: clientFetchMock,
  }),
}));

interface RoleOption {
  value: string;
  label: string;
}

describe("RoleManager", () => {
  const organizationId = "org-123";
  const userId = "user-1";

  const roleOptions: RoleOption[] = [
    { value: "role-1", label: "Admin" },
    { value: "role-2", label: "Viewer" },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    lastModalProps = null;
  });

  it("renders a select with the current role selected", () => {
    render(
      <RoleManager
        organizationId={organizationId}
        userId={userId}
        currentRoleId="role-1"
        roleOptions={roleOptions}
      />,
    );

    const select = screen.getByTestId("Select");

    expect(select).toBeInTheDocument();
    expect((select as HTMLSelectElement).value).toBe("role-1");
  });

  it("opens the confirmation modal with the correct nextRoleName when a different role is selected", () => {
    render(
      <RoleManager
        organizationId={organizationId}
        userId={userId}
        currentRoleId="role-1"
        roleOptions={roleOptions}
      />,
    );

    const select = screen.getByTestId("Select");

    fireEvent.change(select, { target: { value: "role-2" } });

    expect(lastModalProps).not.toBeNull();
    if (!lastModalProps) {
      throw new Error("Modal props not set");
    }

    expect(lastModalProps.nextRoleName).toBe("Viewer");
    expect(lastModalProps.isSubmitting).toBe(false);
  });

  it("does not commit the change when the modal cancel handler is called", () => {
    render(
      <RoleManager
        organizationId={organizationId}
        userId={userId}
        currentRoleId="role-1"
        roleOptions={roleOptions}
      />,
    );

    const select = screen.getByTestId("Select");

    fireEvent.change(select, { target: { value: "role-2" } });

    expect(lastModalProps).not.toBeNull();
    if (!lastModalProps) {
      throw new Error("Modal props not set");
    }

    lastModalProps.onCancel();

    expect(clientFetchMock).not.toHaveBeenCalled();
  });

  it("calls clientFetch and updates the selected value when the modal confirm handler is called", async () => {
    clientFetchMock.mockResolvedValueOnce({});

    render(
      <RoleManager
        organizationId={organizationId}
        userId={userId}
        currentRoleId="role-1"
        roleOptions={roleOptions}
      />,
    );

    const select = screen.getByTestId("Select");

    fireEvent.change(select, { target: { value: "role-2" } });

    expect(lastModalProps).not.toBeNull();
    if (!lastModalProps) {
      throw new Error("Modal props not set");
    }

    lastModalProps.onConfirm();

    await waitFor(() => {
      expect(clientFetchMock).toHaveBeenCalledTimes(1);
    });

    const [url, options] = clientFetchMock.mock.calls[0];

    expect(url).toBe(
      `/api/user/organizations/${organizationId}/users/${userId}`,
    );
    expect(options).toEqual({
      method: "PUT",
      body: JSON.stringify({ role_ids: ["role-2"] }),
    });

    expect((select as HTMLSelectElement).value).toBe("role-2");
  });

  it("sets errorMessage on the modal when clientFetch rejects", async () => {
    clientFetchMock.mockRejectedValueOnce(new Error("Server said no"));

    render(
      <RoleManager
        organizationId={organizationId}
        userId={userId}
        currentRoleId="role-1"
        roleOptions={roleOptions}
      />,
    );

    const select = screen.getByTestId("Select");

    fireEvent.change(select, { target: { value: "role-2" } });

    expect(lastModalProps).not.toBeNull();
    if (!lastModalProps) {
      throw new Error("Modal props not set");
    }

    lastModalProps.onConfirm();

    await waitFor(() => {
      expect(clientFetchMock).toHaveBeenCalledTimes(1);
    });

    expect(lastModalProps.errorMessage).toBe("Server said no");
  });
});

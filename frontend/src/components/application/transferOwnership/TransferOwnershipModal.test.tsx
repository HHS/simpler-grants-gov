import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { UserOrganization } from "src/types/userTypes";

import React, { createRef } from "react";
import type { ModalRef } from "@trussworks/react-uswds";

import { TransferOwnershipModal } from "./TransferOwnershipModal";

/* ------------------------------------------------------------------ */
/* Mocks                                                              */
/* ------------------------------------------------------------------ */

type UseUserOrganizationsResult = {
  organizations: UserOrganization[];
  isLoading: boolean;
  hasError: boolean;
};

const useUserOrganizationsMock = jest.fn<UseUserOrganizationsResult, []>();

type TransferOwnershipSuccessResponse = {
  message: string;
  data: {
    application_id: string;
  };
};

type ClientFetch = (
  input: string,
  init?: {
    method?: string;
    headers?: Record<string, string>;
    body?: string;
  },
) => Promise<TransferOwnershipSuccessResponse>;

const clientFetchMock = jest.fn<
  ReturnType<ClientFetch>,
  Parameters<ClientFetch>
>();

const routerRefreshMock = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh: routerRefreshMock,
  }),
}));

jest.mock("next-intl", () => ({
  useTranslations: () => {
    const translate = ((key: string) => key) as ((key: string) => string) & {
      rich: (
        key: string,
        values: Record<string, (chunks: React.ReactNode) => React.ReactNode>,
      ) => React.ReactNode;
    };

    translate.rich = (
      key: string,
      values: Record<string, (chunks: React.ReactNode) => React.ReactNode>,
    ) => {
      if (key === "body") {
        const paragraphRenderer = values.p;
        return <>{paragraphRenderer("Body paragraph")}</>;
      }

      if (key === "contactSupport") {
        const telRenderer = values.tel;
        const linkRenderer = values.link;
        return (
          <>
            {telRenderer("1-800-518-4726")}
            {linkRenderer("simpler@grants.gov")}
          </>
        );
      }

      return key;
    };

    return translate;
  },
}));

jest.mock("src/hooks/useUserOrganizations", () => ({
  useUserOrganizations: () => useUserOrganizationsMock(),
}));

jest.mock("src/hooks/useClientFetch", () => ({
  useClientFetch: () => ({
    clientFetch: (...args: Parameters<ClientFetch>) => clientFetchMock(...args),
  }),
}));

jest.mock("src/components/SimplerModal", () => ({
  SimplerModal: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="simpler-modal">{children}</div>
  ),
}));

jest.mock("./TransferOwnershipOrganizationSelect", () => ({
  TransferOwnershipOrganizationSelect: ({
    isDisabled,
    selectedOrganization,
    onOrganizationChange,
    organizations,
  }: {
    isDisabled?: boolean;
    selectedOrganization?: string;
    onOrganizationChange: (event: React.ChangeEvent<HTMLSelectElement>) => void;
    organizations: UserOrganization[];
  }) => (
    <select
      aria-label="Who is applying?"
      disabled={Boolean(isDisabled)}
      value={selectedOrganization ?? ""}
      onChange={onOrganizationChange}
    >
      <option value="" disabled>
        -Select-
      </option>
      {organizations.map((organization) => (
        <option
          key={organization.organization_id}
          value={organization.organization_id}
        >
          {organization.sam_gov_entity.legal_business_name}
        </option>
      ))}
    </select>
  ),
}));

/**
 * Minimal USWDS override:
 * Keep real components, override only ModalToggleButton to avoid coupling to modal internals in tests.
 */
jest.mock("@trussworks/react-uswds", () => {
  const actual = jest.requireActual("@trussworks/react-uswds") as Record<
    string,
    unknown
  >;

  return {
    ...actual,
    ModalToggleButton: ({
      children,
      onClick,
      "data-testid": dataTestId,
    }: {
      children: React.ReactNode;
      onClick?: () => void;
      "data-testid"?: string;
    }) => (
      <button type="button" data-testid={dataTestId} onClick={onClick}>
        {children}
      </button>
    ),
  };
});

/* ------------------------------------------------------------------ */
/* Fixtures                                                           */
/* ------------------------------------------------------------------ */

const fakeOrganizations: UserOrganization[] = [
  {
    organization_id: "org-1",
    sam_gov_entity: {
      legal_business_name: "Org One",
      uei: "UEI1",
      expiration_date: "2099-01-01",
      ebiz_poc_email: "orgone@example.com",
      ebiz_poc_first_name: "Org",
      ebiz_poc_last_name: "One",
    },
    is_organization_owner: false,
  },
];

describe("TransferOwnershipModal", () => {
  const modalId = "transfer-ownership-modal";
  const applicationId = "app-123";

  const onAfterCloseMock = jest.fn();

  function renderModal(overrides: Partial<UseUserOrganizationsResult> = {}): {
    modalRef: React.RefObject<ModalRef | null>;
  } {
    const modalRef = createRef<ModalRef>();

    // Provide a toggleModal implementation so handleTransfer can call it safely.
    modalRef.current = {
      toggleModal: jest.fn(),
    } as unknown as ModalRef;

    useUserOrganizationsMock.mockReturnValue({
      organizations: fakeOrganizations,
      isLoading: false,
      hasError: false,
      ...overrides,
    });

    render(
      <TransferOwnershipModal
        applicationId={applicationId}
        modalId={modalId}
        modalRef={modalRef}
        onAfterClose={onAfterCloseMock}
      />,
    );

    return { modalRef };
  }

  beforeEach(() => {
    useUserOrganizationsMock.mockReset();
    clientFetchMock.mockReset();
    routerRefreshMock.mockReset();
    onAfterCloseMock.mockReset();
  });

  it("renders core content and confirm is disabled when nothing selected", () => {
    renderModal({ organizations: fakeOrganizations, isLoading: false });

    expect(screen.getByText("title")).toBeInTheDocument();
    expect(screen.getByText("warningTitle")).toBeInTheDocument();
    expect(screen.getByText("warningBody")).toBeInTheDocument();

    expect(screen.getByTestId("transfer-ownership-confirm")).toBeDisabled();
  });

  it("shows error message and contact links when organizations fail to load", () => {
    renderModal({ organizations: [], isLoading: false, hasError: true });

    expect(
      screen.getByText("failedFetchingOrganizationErrorMessage"),
    ).toBeInTheDocument();

    const phoneLink = screen.getByRole("link", { name: "1-800-518-4726" });
    expect(phoneLink).toHaveAttribute("href", "tel:1-800-518-4726");

    const emailLink = screen.getByRole("link", { name: "simpler@grants.gov" });
    expect(emailLink).toHaveAttribute("href", "mailto:simpler@grants.gov");
  });

  it("renders cancel button and calls onAfterClose when clicked", () => {
    renderModal();

    fireEvent.click(screen.getByTestId("transfer-ownership-cancel"));
    expect(onAfterCloseMock).toHaveBeenCalledTimes(1);
  });

  it("enables confirm after selecting an organization and calls transfer endpoint", async () => {
    const { modalRef } = renderModal();

    clientFetchMock.mockResolvedValue({
      message: "ok",
      data: { application_id: applicationId },
    });

    fireEvent.change(screen.getByLabelText("Who is applying?"), {
      target: { value: "org-1" },
    });

    const confirmButton = screen.getByTestId("transfer-ownership-confirm");
    expect(confirmButton).not.toBeDisabled();

    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(clientFetchMock).toHaveBeenCalledWith(
        `/api/applications/${applicationId}/transfer-ownership`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ organization_id: "org-1" }),
        },
      );
    });

    await waitFor(() => {
      expect(modalRef.current?.toggleModal).toHaveBeenCalled();
      expect(onAfterCloseMock).toHaveBeenCalledTimes(1);
      expect(routerRefreshMock).toHaveBeenCalledTimes(1);
    });
  });

  it("shows submit error message when transfer request fails", async () => {
    renderModal();

    clientFetchMock.mockRejectedValue(new Error("boom"));

    fireEvent.change(screen.getByLabelText("Who is applying?"), {
      target: { value: "org-1" },
    });

    fireEvent.click(screen.getByTestId("transfer-ownership-confirm"));

    await waitFor(() => {
      expect(screen.getByText("transferErrorMessage")).toBeInTheDocument();
    });
  });
});

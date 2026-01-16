import { fireEvent, render, screen } from "@testing-library/react";
import type { UserOrganization } from "src/types/userTypes";

import React, { createRef } from "react";
import type { ModalRef } from "@trussworks/react-uswds";

import { TransferOwnershipModal } from "./TransferOwnershipModal";

type UseUserOrganizationsResult = {
  organizations: UserOrganization[];
  isLoading: boolean;
  hasError: boolean;
};

const useUserOrganizationsMock = jest.fn<UseUserOrganizationsResult, []>();

jest.mock("src/hooks/useUserOrganizations", () => ({
  useUserOrganizations: () => useUserOrganizationsMock(),
}));

jest.mock("src/hooks/useClientFetch", () => ({
  useClientFetch: () => ({
    clientFetch: jest.fn(),
  }),
}));

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh: jest.fn(),
  }),
}));

jest.mock("next-intl", () => ({
  useTranslations: () => {
    const translate = (key: string) => key;

    translate.rich = (key: string, values: Record<string, unknown>) => {
      type RichRenderer = (content: string) => React.ReactNode;

      if (key === "body") {
        const paragraphRenderer = values.p as RichRenderer;
        return <>{paragraphRenderer("Body paragraph")}</>;
      }

      if (key === "contactSupport") {
        const telRenderer = values.tel as RichRenderer;
        const linkRenderer = values.link as RichRenderer;

        return (
          <>
            {telRenderer("1-800-518-4726")}
            {linkRenderer("simpler@grants.gov")}
          </>
        );
      }

      return translate(key);
    };

    return translate;
  },
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

jest.mock("src/components/SimplerModal", () => ({
  SimplerModal: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="simpler-modal">{children}</div>
  ),
}));

jest.mock("@trussworks/react-uswds", () => ({
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

  Alert: ({
    children,
    className,
    heading,
  }: {
    children: React.ReactNode;
    className?: string;
    heading?: string;
  }) => (
    <div className={className}>
      {heading ? <div>{heading}</div> : null}
      {children}
    </div>
  ),

  Button: ({
    children,
    disabled,
    onClick,
    "data-testid": dataTestId,
  }: {
    children: React.ReactNode;
    disabled?: boolean;
    onClick?: () => void;
    "data-testid"?: string;
  }) => (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      data-testid={dataTestId}
    >
      {children}
    </button>
  ),

  ModalFooter: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  ModalHeading: ({ children }: { children: React.ReactNode }) => (
    <h2>{children}</h2>
  ),
}));

describe("TransferOwnershipModal", () => {
  const modalId = "transfer-ownership-modal";

  function renderModal(): void {
    const modalRef = createRef<ModalRef>();
    const onAfterClose = jest.fn();

    render(
      <TransferOwnershipModal
        applicationId="app-123"
        modalId={modalId}
        modalRef={modalRef}
        onAfterClose={onAfterClose}
      />,
    );
  }

  beforeEach(() => {
    useUserOrganizationsMock.mockReset();
  });

  it("renders core content and confirm is disabled", () => {
    useUserOrganizationsMock.mockReturnValue({
      organizations: [],
      isLoading: false,
      hasError: false,
    });

    renderModal();

    expect(screen.getByText("title")).toBeInTheDocument();
    expect(screen.getByText("warningTitle")).toBeInTheDocument();
    expect(screen.getByText("warningBody")).toBeInTheDocument();

    expect(screen.getByTestId("transfer-ownership-confirm")).toBeDisabled();
  });

  it("shows error message and contact links when organizations fail to load", () => {
    useUserOrganizationsMock.mockReturnValue({
      organizations: [],
      isLoading: false,
      hasError: true,
    });

    renderModal();

    expect(
      screen.getByText("failedFetchingOrganizationErrorMessage"),
    ).toBeInTheDocument();

    const phoneLink = screen.getByRole("link", { name: "1-800-518-4726" });
    expect(phoneLink).toHaveAttribute("href", "tel:1-800-518-4726");

    const emailLink = screen.getByRole("link", { name: "simpler@grants.gov" });
    expect(emailLink).toHaveAttribute("href", "mailto:simpler@grants.gov");
  });

  it("renders cancel button and it is clickable", () => {
    useUserOrganizationsMock.mockReturnValue({
      organizations: [],
      isLoading: false,
      hasError: false,
    });

    renderModal();

    const cancelButton = screen.getByTestId("transfer-ownership-cancel");
    expect(cancelButton).toBeInTheDocument();

    fireEvent.click(cancelButton);
  });
});

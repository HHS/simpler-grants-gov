import { fireEvent, render, screen } from "@testing-library/react";
import type { UserOrganization } from "src/types/userTypes";

import { createRef } from "react";
import type { ModalRef } from "@trussworks/react-uswds";

import { TransferOwnershipModal } from "./TransferOwnershipModal";

type UseUserOrganizationsResult = {
  organizations: UserOrganization[];
  isLoading: boolean;
  hasError: boolean;
};

const useUserOrganizationsMock = jest.fn<UseUserOrganizationsResult, []>();

jest.mock("next-intl", () => ({
  useTranslations: () => {
    const translate = (key: string) => key;

    translate.rich = (key: string, values: Record<string, unknown>) => {
      type RichRenderer = (content: string) => React.ReactNode;

      if (key === "body") {
        const paragraphRenderer = values.p as RichRenderer;
        return <>{paragraphRenderer("Body paragraph")}</>;
      }

      return translate(key);
    };

    return translate;
  },
}));

jest.mock("src/components/ModalFooterProductSupport", () => ({
  ModalFooterProductSupport: () => (
    <div data-testid="modal-footer-product-support" />
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

jest.mock("src/hooks/useUserOrganizations", () => ({
  useUserOrganizations: () => useUserOrganizationsMock(),
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
    render(<TransferOwnershipModal modalId={modalId} modalRef={modalRef} />);
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

  it("shows error message when organizations fail to load", () => {
    useUserOrganizationsMock.mockReturnValue({
      organizations: [],
      isLoading: false,
      hasError: true,
    });

    renderModal();

    expect(screen.getByText("errorMessage")).toBeInTheDocument();
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

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { RefObject } from "react";
import { ModalRef } from "@trussworks/react-uswds";

import { DrawerControl } from "src/components/drawer/DrawerControl";

const mockToggleModal = jest.fn();

const createModalRef = (): RefObject<ModalRef> => ({
  current: {
    modalId: "test-modal",
    modalIsOpen: true,
    toggleModal: mockToggleModal,
    focus: jest.fn(),
  } as unknown as ModalRef,
});

describe("DrawerControl", () => {
  it("renders correct button text", () => {
    const ref = createModalRef();
    render(<DrawerControl drawerRef={ref} buttonText="close me" />);

    expect(screen.getByText("close me")).toBeInTheDocument();
  });
  it("should call ref toggle function on toggle button click", async () => {
    const ref = createModalRef();
    render(<DrawerControl drawerRef={ref} buttonText="close me" />);

    const closeButton = screen.getByText("close me");
    expect(mockToggleModal).not.toHaveBeenCalled();

    await userEvent.click(closeButton);

    expect(mockToggleModal).toHaveBeenCalled();
  });
  it("renders an icon by name", () => {
    const ref = createModalRef();
    render(
      <DrawerControl
        drawerRef={ref}
        buttonText="close me"
        iconName="account_circle"
      />,
    );
    const icon = screen.getByRole("img", { hidden: true });
    expect(icon).toBeInTheDocument();
    expect(icon).toHaveClass("usa-icon");
    const iconChild = icon.childNodes[0] as HTMLElement;
    const href = iconChild.attributes.getNamedItem("href")?.value;
    expect(href).toMatch("account_circle");
  });
});

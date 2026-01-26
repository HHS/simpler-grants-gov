import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { noop } from "lodash";

import { createRef } from "react";

import { SimplerModal } from "src/components/SimplerModal";

const mockUseIsSSR = jest.fn();
const createPortalSpy = jest.fn();

jest.mock("src/hooks/useIsSSR", () => ({
  useIsSSR: () => mockUseIsSSR() as unknown,
}));

jest.mock("react-dom", () => ({
  ...jest.requireActual<typeof import("react-dom")>("react-dom"),
  createPortal: (modal: unknown) => createPortalSpy(modal) as unknown,
}));

describe("SimplerModal", () => {
  beforeEach(() => {
    mockUseIsSSR.mockReturnValue(false);
    createPortalSpy.mockImplementation((modal) => modal as unknown);
  });
  afterEach(() => {
    jest.resetAllMocks();
  });
  it("displays header", () => {
    render(
      <SimplerModal
        modalRef={createRef()}
        titleText="title text"
        modalId="modal-id"
        className="modal-class"
        onKeyDown={noop}
        onClose={noop}
      >
        <div id="modal-id-description">content</div>
      </SimplerModal>,
    );

    expect(screen.getByText("title text")).toBeInTheDocument();
  });
  it("displays children", () => {
    render(
      <SimplerModal
        modalRef={createRef()}
        titleText="title text"
        modalId="modal-id"
        className="modal-class"
        onKeyDown={noop}
        onClose={noop}
      >
        <div id="modal-id-description">content</div>
      </SimplerModal>,
    );

    expect(screen.getByText("content")).toBeInTheDocument();
    expect(screen.getByText("content")).toBeVisible();
    expect(createPortalSpy).toHaveBeenCalled();
  });
  it("does not render to portal if ssr", () => {
    mockUseIsSSR.mockReturnValue(true);
    render(
      <SimplerModal
        modalRef={createRef()}
        titleText="title text"
        modalId="modal-id"
        className="modal-class"
        onKeyDown={noop}
        onClose={noop}
      >
        <div id="modal-id-description">content</div>
      </SimplerModal>,
    );

    expect(createPortalSpy).not.toHaveBeenCalled();
  });
  it("runs onClose handler on escape key", async () => {
    const onCloseMock = jest.fn();
    render(
      <SimplerModal
        modalRef={createRef()}
        titleText="title text"
        modalId="modal-id"
        className="modal-class"
        onKeyDown={noop}
        onClose={onCloseMock}
      >
        <div id="modal-id-description">content</div>
      </SimplerModal>,
    );
    const modal = screen.getByRole("button");
    modal.focus();
    await userEvent.keyboard("{Escape}");

    expect(onCloseMock).toHaveBeenCalled();
  });
  it("runs onClose handler on 'x' button click", async () => {
    const onCloseMock = jest.fn();
    render(
      <SimplerModal
        modalRef={createRef()}
        titleText="title text"
        modalId="modal-id"
        className="modal-class"
        onKeyDown={noop}
        onClose={onCloseMock}
      >
        <div id="modal-id-description">content</div>
      </SimplerModal>,
    );
    const xButton = screen.getByLabelText("Close this window");
    await userEvent.click(xButton);

    expect(onCloseMock).toHaveBeenCalled();
  });
  it("runs onKeydown function on key down", async () => {
    const user = userEvent.setup();
    const keyHandlerMock = jest.fn();
    render(
      <SimplerModal
        modalRef={createRef()}
        titleText="title text"
        modalId="modal-id"
        className="modal-class"
        onKeyDown={keyHandlerMock}
        onClose={noop}
      >
        <div id="modal-id-description">content</div>
      </SimplerModal>,
    );
    const modal = screen.getByRole("button");
    modal.focus();
    await user.keyboard("!");
    expect(keyHandlerMock).toHaveBeenCalled();
  });
});

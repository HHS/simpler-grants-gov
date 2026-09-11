import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { noop } from "lodash";

import { createRef } from "react";

import { SimplerModal } from "src/components/core/SimplerModal";

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

  // The accessible name and description are computed from aria-labelledby and
  // aria-describedby, so they come back empty when those attributes reference an
  // id that nothing renders - which is what WAVE reports as a broken ARIA
  // reference. https://github.com/HHS/simpler-grants-gov/issues/11493
  describe("ARIA references", () => {
    it("names the dialog with the heading it renders from titleText", () => {
      render(
        <SimplerModal
          modalRef={createRef()}
          titleText="title text"
          modalId="modal-id"
        >
          <p>content</p>
        </SimplerModal>,
      );

      const dialog = screen.getByRole("dialog");
      expect(dialog).toHaveAttribute("aria-labelledby", "modal-id-heading");
      expect(dialog).toHaveAccessibleName("title text");
    });

    it("names the dialog with a heading supplied by children", () => {
      // Consumers such as SaveSearchModal render their own heading instead of
      // passing titleText, so the reference has to stay put in that case too.
      render(
        <SimplerModal modalRef={createRef()} modalId="modal-id">
          <h2 id="modal-id-heading">title text</h2>
          <p>content</p>
        </SimplerModal>,
      );

      expect(screen.getByRole("dialog")).toHaveAccessibleName("title text");
    });

    it("omits aria-describedby when no descriptionId is given", () => {
      // Defaulting this to a generated wrapper around `children` would make the
      // modal's whole body its accessible description, which screen readers read
      // out in full on open. Truss logs a console error for the missing
      // attribute; that noise beats a paragraphs-long announcement.
      render(
        <SimplerModal
          modalRef={createRef()}
          titleText="title text"
          modalId="modal-id"
        >
          <p>content</p>
        </SimplerModal>,
      );

      const dialog = screen.getByRole("dialog");
      expect(dialog).not.toHaveAttribute("aria-describedby");
      expect(dialog).toHaveAccessibleDescription("");
    });

    it("does not wrap children, so a consumer's own -description id stays unique", () => {
      // ShareOpportunityToOrganizationsModal renders its own sr-only description
      // element; a generated wrapper using the same id would duplicate it.
      render(
        <SimplerModal
          modalRef={createRef()}
          titleText="title text"
          modalId="modal-id"
          descriptionId="modal-id-description"
        >
          <p id="modal-id-description">the description</p>
        </SimplerModal>,
      );

      // Testing Library has no query for "how many elements carry this id",
      // which is exactly what this guards against.
      // eslint-disable-next-line testing-library/no-node-access
      const withId = document.querySelectorAll('[id="modal-id-description"]');
      expect(withId).toHaveLength(1);
    });

    it("describes the dialog with only the element named by descriptionId", () => {
      render(
        <SimplerModal
          modalRef={createRef()}
          titleText="title text"
          modalId="modal-id"
          descriptionId="modal-id-description"
        >
          <p id="modal-id-description">the description</p>
          <p>other content</p>
        </SimplerModal>,
      );

      const dialog = screen.getByRole("dialog");
      expect(dialog).toHaveAttribute(
        "aria-describedby",
        "modal-id-description",
      );
      expect(dialog).toHaveAccessibleDescription("the description");
    });

    it("passes accessibility scan", async () => {
      render(
        <SimplerModal
          modalRef={createRef()}
          titleText="title text"
          modalId="modal-id"
          descriptionId="modal-id-description"
        >
          <p id="modal-id-description">content</p>
        </SimplerModal>,
      );

      // This file's createPortal mock keeps the dialog inside the container, so
      // `container` would work here - but scan document.body so the assertion
      // does not silently go vacuous if that mock is ever removed.
      const results = await waitFor(() => axe(document.body));
      expect(results).toHaveNoViolations();
    });
  });
});

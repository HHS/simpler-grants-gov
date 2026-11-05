import { useIsSSR } from "src/hooks/useIsSSR";

import {
  KeyboardEventHandler,
  ReactNode,
  RefObject,
  useCallback,
  useEffect,
  useRef,
} from "react";
import { Modal, ModalHeading, ModalRef } from "@trussworks/react-uswds";

import "react-dom";

/*
  SimplerModal

  Wrapper for the Truss Modal component that provides common functionality shared
  by all modals within the Simpler application.

  Responsibilities:

  - Avoid pre-render errors using the `useIsSSR` hook:
    The Truss Modal uses React portals under the hood. Rendering to a portal
    during SSR can throw, so we explicitly disable `renderToPortal` on the
    server and only enable it on the client.

  - Provide a unified `onClose` callback:
    The underlying component does not expose a single "modal was dismissed"
    callback that covers all close paths. Consumers of SimplerModal often
    need to run cleanup logic whenever the modal closes, regardless of how
    the close was triggered.

  - Normalize close behavior across:
    * clicking the "X" close button
    * pressing the Escape key
    * clicking the overlay behind the modal

    Because the overlay is rendered via a portal, overlay clicks do not
    flow through the Modal's own `onClick` handler. To detect them, we
    listen at the window level and check for clicks on the overlay element.

  - Provide an `onOpen` callback:
    The underlying Modal manages its open/closed state internally and only
    exposes it imperatively via `modalRef`, so there is no render-time prop
    to react to. Truss toggles an `is-visible` class on the dialog element
    (id `modalId`) when it opens, so a MutationObserver on that element is
    used to detect the transition and fire `onOpen` once per open.
*/

export function SimplerModal({
  modalRef,
  className,
  modalId,
  titleText,
  descriptionId,
  children,
  onKeyDown,
  onClose,
  onOpen,
}: {
  modalRef: RefObject<ModalRef | null>;
  titleText?: string;
  modalId: string;
  // Id of the element within `children` that describes the modal. Screen readers
  // read this in full when focus enters the dialog, so point it at a short summary,
  // never at a whole form or filter tree. Pass it only when that element renders in
  // the state being shown - an `aria-describedby` naming a missing id is a broken
  // ARIA reference, so states with no description should leave it undefined.
  descriptionId?: string;
  className?: string;
  children: ReactNode;
  onKeyDown?: KeyboardEventHandler<HTMLDivElement>;
  onClose?: () => void;
  onOpen?: () => void;
}) {
  // Detect SSR so we can control whether the modal renders into a portal.
  const isSSR = useIsSSR();

  /*
    Handle clicks on the overlay element.

    The overlay is rendered in a portal outside the React tree that contains
    <Modal />, so clicks on it never reach the `onClick` handler passed to
    the Modal component. To include overlay clicks in the unified close
    behavior, a window-level click listener is attached and checks for
    clicks on the overlay element by its CSS class.
  */
  const handleWindowClick = useCallback(
    (event: MouseEvent) => {
      if (!onClose) return;

      const target = event.target;
      if (!(target instanceof Element)) {
        return;
      }

      // The Truss overlay element uses this class. If that element is
      // clicked, treat it as a close event and call `onClose`.
      if (target.classList.contains("usa-modal-overlay")) {
        onClose();
      }
    },
    [onClose],
  );

  /*
    Register and clean up the window click handler.

    The listener is only attached when an `onClose` callback is provided and
    we are running in a browser environment. The handler is memoized with
    `useCallback`, so add/remove receive the same function reference and
    cleanup works as expected.
  */
  useEffect(() => {
    if (!onClose) return;
    if (typeof window === "undefined") return;

    window.addEventListener("click", handleWindowClick);

    return () => {
      window.removeEventListener("click", handleWindowClick);
    };
  }, [handleWindowClick, onClose]);

  /*
    Detect when the modal transitions to visible.

    `wasVisible` tracks the last observed state so `onOpen` fires once per
    open rather than on every subsequent class mutation while visible.

    `isSSR` is a dependency (not just a guard) because the dialog element
    is re-created when rendering switches from inline to the portal - the
    element observed on first mount is torn down, so the observer must be
    re-attached to the new one once that switch happens.
  */
  const wasVisible = useRef(false);

  useEffect(() => {
    if (!onOpen) return;
    if (typeof window === "undefined") return;

    const modalElement = document.getElementById(modalId);
    if (!modalElement) return;

    const notifyIfOpened = () => {
      const isVisible = modalElement.classList.contains("is-visible");
      if (isVisible && !wasVisible.current) {
        onOpen();
      }
      wasVisible.current = isVisible;
    };

    const observer = new MutationObserver(notifyIfOpened);
    observer.observe(modalElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, [modalId, onOpen, isSSR]);

  return (
    <Modal
      ref={modalRef}
      // Leave `forceAction` false so the modal can still be dismissed via
      // overlay, close button, or Escape. All of these paths are funneled
      // through `onClose` by this wrapper.
      forceAction={false}
      className={className}
      // Every consumer supplies a `${modalId}-heading` element, either through
      // `titleText` below or by rendering its own heading within `children`.
      aria-labelledby={`${modalId}-heading`}
      // Omitted rather than defaulted: pointing this at a generated wrapper would
      // make the modal's entire body its accessible description, which screen
      // readers read out in full on open. Truss logs a console error when it is
      // absent - that noise is preferable to a paragraphs-long announcement.
      aria-describedby={descriptionId}
      style={{ margin: 0 }}
      id={modalId}
      // On the server, `renderToPortal` must be false to avoid SSR errors.
      // On the client, the modal renders into a portal for proper a11y and
      // focus management.
      renderToPortal={!isSSR}
      onClick={(clickEvent) => {
        if (!onClose) {
          return;
        }

        const clickTarget = clickEvent.target as Element;

        // The Truss Modal renders a close button with the `usa-modal__close`
        // class. When that is clicked, treat it as a close event and call
        // `onClose`. We use `closest()` because the click target may be a
        // child element (e.g. the SVG icon inside the button).
        if (clickTarget.closest(".usa-modal__close")) {
          onClose();
        }
      }}
      onKeyDown={(keyEvent) => {
        // Pressing Escape should also trigger the unified `onClose`
        // callback so consumers can handle cleanup in a single place.
        if (onClose && keyEvent.key === "Escape") {
          onClose();
        }

        // Delegate additional key handling to the caller if needed.
        if (onKeyDown) {
          onKeyDown(keyEvent);
        }
      }}
    >
      {titleText && (
        <ModalHeading id={`${modalId}-heading`}>{titleText}</ModalHeading>
      )}
      {children}
    </Modal>
  );
}

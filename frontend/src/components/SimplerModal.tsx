import { useIsSSR } from "src/hooks/useIsSSR";

import {
  KeyboardEventHandler,
  ReactNode,
  RefObject,
  useCallback,
  useEffect,
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
*/

export function SimplerModal({
  modalRef,
  className,
  modalId,
  titleText,
  children,
  onKeyDown,
  onClose,
}: {
  modalRef: RefObject<ModalRef | null>;
  titleText?: string;
  modalId: string;
  className?: string;
  children: ReactNode;
  onKeyDown?: KeyboardEventHandler<HTMLDivElement>;
  onClose?: () => void;
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

  return (
    <Modal
      ref={modalRef}
      // Leave `forceAction` false so the modal can still be dismissed via
      // overlay, close button, or Escape. All of these paths are funneled
      // through `onClose` by this wrapper.
      forceAction={false}
      className={className}
      aria-labelledby={`${modalId}-heading`}
      aria-describedby={`${modalId}-description`}
      id={modalId}
      // On the server, `renderToPortal` must be false to avoid SSR errors.
      // On the client, the modal renders into a portal for proper a11y and
      // focus management.
      renderToPortal={!isSSR}
      onClick={(clickEvent) => {
        if (!onClose) {
          return;
        }

        const clickTarget = clickEvent.target as HTMLElement;

        // The Truss Modal renders a close button with the `usa-modal__close`
        // class. When that is clicked, treat it as a close event and call
        // `onClose`.
        if (clickTarget.className.includes("usa-modal__close")) {
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

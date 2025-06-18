"use-client";

import SessionStorage from "src/services/auth/sessionStorage";

import { RefObject } from "react";
import {
  ButtonGroup,
  ModalFooter,
  ModalRef,
  ModalToggleButton,
} from "@trussworks/react-uswds";

import { USWDSIcon } from "src/components/USWDSIcon";
import { SimplerModal } from "./SimplerModal";

export const LOGIN_URL = "/api/auth/login";

export const LoginModal = ({
  modalRef,
  helpText,
  titleText,
  descriptionText,
  buttonText,
  closeText,
  modalId,
}: {
  modalRef: RefObject<ModalRef>;
  helpText: string;
  titleText: string;
  descriptionText: string;
  buttonText: string;
  closeText: string;
  modalId: string;
}) => {
  return (
    <SimplerModal
      modalId={modalId}
      modalRef={modalRef}
      titleText={titleText}
      className="text-wrap"
    >
      <LoginModalBody
        buttonText={buttonText}
        closeText={closeText}
        descriptionText={descriptionText}
        helpText={helpText}
        modalRef={modalRef}
      />
    </SimplerModal>
  );
};

export const LoginModalBody = ({
  buttonText,
  closeText,
  descriptionText,
  helpText,
  modalRef,
}: {
  buttonText: string;
  closeText: string;
  descriptionText: string;
  helpText: string;
  modalRef: RefObject<ModalRef | null>;
}) => {
  return (
    <>
      <p>{helpText}</p>
      <p className="font-sans-2xs margin-y-4">{descriptionText}</p>
      <ModalFooter>
        <ButtonGroup>
          <a
            href={LOGIN_URL}
            key="login-link"
            className="usa-button"
            onClick={() => {
              const startURL = `${location.pathname}${location.search}`;
              if (startURL !== "") {
                SessionStorage.setItem("login-redirect", startURL);
              }
            }}
          >
            {buttonText}
            <USWDSIcon
              className="usa-icon margin-right-05 margin-left-neg-05"
              name="launch"
              key="login-gov-link-icon"
            />
          </a>
          <ModalToggleButton
            modalRef={modalRef}
            closer
            unstyled
            className="padding-105 text-center"
          >
            {closeText}
          </ModalToggleButton>
        </ButtonGroup>
      </ModalFooter>
    </>
  );
};

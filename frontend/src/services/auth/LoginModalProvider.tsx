"use client";

import { useTranslations } from "next-intl";
import {
  createContext,
  PropsWithChildren,
  RefObject,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";
import { ModalRef } from "@trussworks/react-uswds";

import { LoginModal } from "src/components/core/loginModal/LoginModal";

type LoginModalContextValue = {
  loginModalRef: RefObject<ModalRef | null>;
  setHelpText: (text: string) => void;
  setTitleText: (text: string) => void;
  setDescriptionText: (text: string) => void;
  setButtonText: (text: string) => void;
  setCloseText: (text: string) => void;
};

const LoginModalContext = createContext<LoginModalContextValue | null>(null);

export const useLoginModal = () => {
  const ctx = useContext(LoginModalContext);
  if (ctx === null) {
    throw new Error("useLoginModal must be used within <LoginModalProvider>");
  }
  return ctx;
};

export function LoginModalProvider({ children }: PropsWithChildren) {
  const loginModalRef = useRef<ModalRef | null>(null);
  const t = useTranslations("HeaderLoginModal");

  // The modal is mounted on every page so consumers can toggle it through the ref,
  // which means it is present in the DOM before any consumer sets its copy. Default
  // to the generic sign in wording rather than empty strings, otherwise the closed
  // modal renders an unlabeled link, an unlabeled button, and a heading id that
  // nothing points at.
  const [helpText, setHelpText] = useState<string>(t("help"));
  const [titleText, setTitleText] = useState<string>(t("title"));
  const [descriptionText, setDescriptionText] = useState<string>(
    t("description"),
  );
  const [buttonText, setButtonText] = useState<string>(t("button"));
  const [closeText, setCloseText] = useState<string>(t("close"));

  const contextValue = useMemo(
    () => ({
      loginModalRef,
      setHelpText,
      setTitleText,
      setDescriptionText,
      setButtonText,
      setCloseText,
    }),
    [
      loginModalRef,
      setHelpText,
      setTitleText,
      setDescriptionText,
      setButtonText,
      setCloseText,
    ],
  );

  return (
    <>
      <LoginModal
        modalRef={loginModalRef as RefObject<ModalRef>}
        helpText={helpText}
        titleText={titleText}
        descriptionText={descriptionText}
        buttonText={buttonText}
        closeText={closeText}
        modalId={"simpler-login-modal"}
      />
      <LoginModalContext.Provider value={contextValue}>
        {children}
      </LoginModalContext.Provider>
    </>
  );
}

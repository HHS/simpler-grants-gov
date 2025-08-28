"use client";

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

import { LoginModal } from "src/components/LoginModal";

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

  const [helpText, setHelpText] = useState<string>("");
  const [titleText, setTitleText] = useState<string>("");
  const [descriptionText, setDescriptionText] = useState<string>("");
  const [buttonText, setButtonText] = useState<string>("");
  const [closeText, setCloseText] = useState<string>("");

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

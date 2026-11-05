"use client";

import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Alert } from "@trussworks/react-uswds";

type ApiKeyAlertContextValue = {
  alertMessage?: string;
  // shows a success confirmation, replacing any previous one
  showAlert: (message: string) => void;
  hideAlert: () => void;
};

const ApiKeyAlertContext = createContext<ApiKeyAlertContextValue>({
  showAlert: () => undefined,
  hideAlert: () => undefined,
});

export const useApiKeyAlert = () => useContext(ApiKeyAlertContext);

/*
  Holds the success confirmation shown on the page after an API key is renamed or deleted.

  The confirmation lives here rather than in the modals because a deleted key's row, and
  the modal with it, is removed from the page once the key list refreshes. It stays until
  another API key modal is opened, and a later confirmation replaces it rather than
  stacking. `ApiKeyAlert` renders it wherever it is placed on the page.
*/
export function ApiKeyAlertProvider({ children }: { children: ReactNode }) {
  // an object rather than the message, so a repeated message still counts as a new
  // confirmation for the focus effect below
  const [alert, setAlert] = useState<{ message: string }>();

  const showAlert = useCallback((message: string) => {
    setAlert({ message });
  }, []);

  const hideAlert = useCallback(() => {
    setAlert(undefined);
  }, []);

  useEffect(() => {
    if (!alert) return;
    const timeout = setTimeout(() => {
      document.getElementById("main-content")?.focus();
    }, 0);
    return () => clearTimeout(timeout);
  }, [alert]);

  const value = useMemo(
    () => ({
      alertMessage: alert?.message,
      showAlert,
      hideAlert,
    }),
    [alert, showAlert, hideAlert],
  );

  return (
    <ApiKeyAlertContext.Provider value={value}>
      {children}
    </ApiKeyAlertContext.Provider>
  );
}

export function ApiKeyAlert() {
  const { alertMessage } = useApiKeyAlert();

  return (
    // always rendered so screen readers announce the alert when it is added
    <div role="status">
      {alertMessage && (
        <Alert
          type="success"
          headingLevel="h2"
          slim
          className="margin-bottom-3"
          data-testid="api-key-alert"
        >
          {alertMessage}
        </Alert>
      )}
    </div>
  );
}

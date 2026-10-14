"use client";

import { useTranslations } from "next-intl";
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

type DeletedApiKeyAlertContextValue = {
  deletedKeyName?: string;
  // shows the deleted key confirmation, replacing any previous one
  showDeletedAlert: (keyName: string) => void;
  hideDeletedAlert: () => void;
};

const DeletedApiKeyAlertContext = createContext<DeletedApiKeyAlertContextValue>(
  {
    showDeletedAlert: () => undefined,
    hideDeletedAlert: () => undefined,
  },
);

export const useDeletedApiKeyAlert = () =>
  useContext(DeletedApiKeyAlertContext);

/*
  Holds the confirmation shown on the page after an API key is deleted.

  The confirmation lives here rather than in the delete modal because the deleted key's
  row, and the modal with it, is removed from the page once the key list refreshes. It
  stays until another API key modal is opened, and a later deletion replaces it rather
  than stacking. `DeletedApiKeyAlert` renders it wherever it is placed on the page.
*/
export function DeletedApiKeyAlertProvider({
  children,
}: {
  children: ReactNode;
}) {
  // an object rather than the name, so deleting a key with a repeated name still
  // counts as a new deletion for the focus effect below
  const [deletedKey, setDeletedKey] = useState<{ keyName: string }>();

  const showDeletedAlert = useCallback((keyName: string) => {
    setDeletedKey({ keyName });
  }, []);

  const hideDeletedAlert = useCallback(() => {
    setDeletedKey(undefined);
  }, []);

  useEffect(() => {
    if (!deletedKey) return;
    const timeout = setTimeout(() => {
      document.getElementById("main-content")?.focus();
    }, 0);
    return () => clearTimeout(timeout);
  }, [deletedKey]);

  const value = useMemo(
    () => ({
      deletedKeyName: deletedKey?.keyName,
      showDeletedAlert,
      hideDeletedAlert,
    }),
    [deletedKey, showDeletedAlert, hideDeletedAlert],
  );

  return (
    <DeletedApiKeyAlertContext.Provider value={value}>
      {children}
    </DeletedApiKeyAlertContext.Provider>
  );
}

export function DeletedApiKeyAlert() {
  const t = useTranslations("ApiDashboard");
  const { deletedKeyName } = useDeletedApiKeyAlert();

  return (
    // always rendered so screen readers announce the alert when it is added
    <div role="status">
      {deletedKeyName && (
        <Alert
          type="success"
          headingLevel="h2"
          slim
          className="margin-bottom-3"
          data-testid="deleted-api-key-alert"
        >
          {t("deleteSuccessMessage", { keyName: deletedKeyName })}
        </Alert>
      )}
    </div>
  );
}

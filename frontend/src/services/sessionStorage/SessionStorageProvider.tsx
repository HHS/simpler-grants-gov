import { useSearchParams } from "next/navigation";
import { createContext, PropsWithChildren, useEffect } from "react";

type SessionStorageProviderState = {
  setSessionStorageItem: (key: string, value: string) => void;
  getSessionStorageItem: (key: string) => string;
};

export const SessionStorageContext = createContext({
  setSessionStorageItem: () => {
    throw new Error("session storage context not properly initialized");
  },
  getSessionStorageItem: () => {
    throw new Error("session storage context not properly initialized");
  },
} as SessionStorageProviderState);

export function SessionStorageProvider({ children }: PropsWithChildren) {
  const searchParams = useSearchParams();
  const getSessionStorageItem = (key: string): string => {
    if (!window.sessionStorage) {
      console.error("session storage not available");
      return "";
    }
    return window.sessionStorage.getItem(key) || "";
  };

  const setSessionStorageItem = (key: string, value: string) => {
    if (!window.sessionStorage) {
      console.error("session storage not available");
      return "";
    }
    return window.sessionStorage.setItem(key, value);
  };

  useEffect(() => {
    const sourceParam = searchParams.get("utm_source");
    if (sourceParam === "Grants.gov") {
      setSessionStorageItem("showLegacySearchReturnNotification", "true");
    }
  }, [searchParams]);

  return (
    <SessionStorageContext
      value={{
        getSessionStorageItem,
        setSessionStorageItem,
      }}
    >
      {children}
    </SessionStorageContext>
  );
}

import { useContext } from "react";

import { SessionStorageContext } from "./SessionStorageProvider";

export function useSessionStorage() {
  const context = useContext(SessionStorageContext);
  if (!context) {
    throw new Error("tried to access session storage outside of provider");
  }
  return context;
}

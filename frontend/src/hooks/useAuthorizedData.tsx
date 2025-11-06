"use client";

import { AuthorizedData } from "src/types/authTypes";

import { createContext, PropsWithChildren, useContext } from "react";

const AuthorizedDataContext = createContext<AuthorizedData>(
  {} as AuthorizedData,
);

export const useAuthorizedData = () => {
  const ctx = useContext(AuthorizedDataContext);
  if (ctx === null) {
    throw new Error(
      "useAuthorizedData must be used within <AuthorizedDataProvider>",
    );
  }
  return ctx;
};

export function AuthorizedDataProvider({
  value,
  children,
}: PropsWithChildren<{ value: AuthorizedData }>) {
  return (
    <AuthorizedDataContext.Provider value={value}>
      {children}
    </AuthorizedDataContext.Provider>
  );
}

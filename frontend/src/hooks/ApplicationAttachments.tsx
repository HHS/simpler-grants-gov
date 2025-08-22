"use client";

import type { Attachment } from "src/types/attachmentTypes";

import { createContext, PropsWithChildren, useContext } from "react";

const AttachmentsContext = createContext<Attachment[] | undefined>(undefined);

export const useApplicationAttachments = () => {
  const ctx = useContext(AttachmentsContext);
  if (ctx === undefined) {
    throw new Error(
      "useApplicationAttachments must be used within <AttachmentsProvider>",
    );
  }
  return ctx;
};

export function AttachmentsProvider({
  value,
  children,
}: PropsWithChildren<{ value: Attachment[] }>) {
  return (
    <AttachmentsContext.Provider value={value}>
      {children}
    </AttachmentsContext.Provider>
  );
}

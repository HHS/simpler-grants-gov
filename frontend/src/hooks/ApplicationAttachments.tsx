"use client";

import type { Attachment } from "src/types/attachmentTypes";

import { createContext, PropsWithChildren, useContext } from "react";

const AttachmentsContext = createContext<Attachment[] | null>(null);

export const useApplicationAttachments = () => {
  const ctx = useContext(AttachmentsContext);
  if (ctx === null) {
    throw new Error(
      "useApplicationAttachments must be used within <AttachmentsProvider>",
    );
  }
  return ctx;
};

export function AttachmentsProvider({
  value,
  children,
}: PropsWithChildren<{ value?: Attachment[] }>) {
  const safe = Array.isArray(value) ? value : [];
  return (
    <AttachmentsContext.Provider value={safe}>
      {children}
    </AttachmentsContext.Provider>
  );
}

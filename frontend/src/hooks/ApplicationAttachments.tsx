"use client";

import { createContext, useContext, PropsWithChildren } from "react";
import type { BasicAttachment } from "src/types/attachmentTypes";

const AttachmentsContext = createContext<BasicAttachment[] | undefined>(undefined);

export const useApplicationAttachments = () => {
  const ctx = useContext(AttachmentsContext);
  if (ctx === undefined) {
    throw new Error("useApplicationAttachments must be used within <AttachmentsProvider>");
  }
  return ctx;
};

export function AttachmentsProvider({
  value,
  children,
}: PropsWithChildren<{ value: BasicAttachment[] }>) {
  return (
    <AttachmentsContext.Provider value={value}>
      {children}
    </AttachmentsContext.Provider>
  );
}
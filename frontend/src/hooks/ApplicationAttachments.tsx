"use client";

import type { Attachment } from "src/types/attachmentTypes";

import { createContext, PropsWithChildren, useContext } from "react";

export interface AttachmentsContext {
  attachments: Attachment[] | null;
  setAttachmentsChanged: (value: boolean) => void;
}

const AttachmentsContext = createContext<AttachmentsContext>(
  {} as AttachmentsContext,
);

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
}: PropsWithChildren<{ value: AttachmentsContext }>) {
  return (
    <AttachmentsContext.Provider value={value}>
      {children}
    </AttachmentsContext.Provider>
  );
}

"use client"

import { createContext, useContext } from "react";
import { Attachment } from "src/types/attachmentTypes";

export const AttachmentContext = createContext<Attachment[] | null>(null);

export const useAttachments = (): Attachment[] => {
  const context = useContext(AttachmentContext);

  console.log("CONTEXT", context)
  return context ?? [];
};
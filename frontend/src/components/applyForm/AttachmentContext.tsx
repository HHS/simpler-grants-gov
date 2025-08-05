"use client";

import { Attachment } from "src/types/attachmentTypes";

import { createContext, useContext } from "react";

export const AttachmentContext = createContext<Attachment[] | null>(null);

export const useAttachments = (): Attachment[] => {
  const context = useContext(AttachmentContext);

  return context ?? [];
};

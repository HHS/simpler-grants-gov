"use client";

import { BasicAttachment } from "src/types/attachmentTypes";

import { createContext, useContext } from "react";

export const AttachmentsContext = createContext([] as BasicAttachment[]);

export const useApplicationAttachments = () => useContext(AttachmentsContext);

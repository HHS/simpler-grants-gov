"use client";

import { FrontendErrorDetails } from "src/types/apiResponseTypes";

export interface LayoutProps {
  children: React.ReactNode;
  params: Promise<{
    locale: string;
  }>;
}

export interface OptionalStringDict {
  [key: string]: string | undefined;
}

export interface ParsedError {
  message?: string;
  searchInputs?: OptionalStringDict;
  status?: number;
  type?: string;
  details?: FrontendErrorDetails;
}

"use client";

import { useState } from "react";

export const useCopyToClipboard = () => {
  const [copied, setCopied] = useState(false);
  const [copying, setCopying] = useState(false);

  const copyToClipboard = async (content: string, contentTime: number) => {
    try {
      setCopying(true);
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setCopying(false);
    } catch (error) {
      setCopied(false);
      setCopying(false);
      console.error(`Error copying to clipboard: ${content}`, error);
    } finally {
      setTimeout(() => {
        setCopied(false);
      }, contentTime); // Reset copied state
    }
  };

  return { copied, copying, copyToClipboard };
};

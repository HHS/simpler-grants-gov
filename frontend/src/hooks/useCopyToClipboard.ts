"use client";

import { useState } from "react";

export const useCopyToClipboard = () => {
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  const copyToClipboard = async (content: string) => {
    try {
      setLoading(true);
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setLoading(false);
    } catch (error) {
      setCopied(false);
      setLoading(false);
      console.error(`Error copying to clipboard: ${content}`, error);
    } finally {
      setTimeout(() => {
        setCopied(false);
      }, 2000); // Reset copied state after 2 seconds
    }
  };

  return { copied, loading, copyToClipboard };
};

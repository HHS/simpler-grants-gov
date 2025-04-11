"use client";

import { useState } from "react";

const COPY_STATE_RESET_DURATION = 6000;

export const useCopyToClipboard = () => {
  const [copied, setCopied] = useState(false);
  const [copying, setCopying] = useState(false);

  // Provides https fallback to clipboard API
  // credit to: https://stackoverflow.com/a/65996386
  const copyWithFallback = async (content: string) => {
    // Use fallback if https is not supported
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(content);
    } else {
      const textArea = document.createElement("textarea");
      textArea.value = content;
      textArea.style.position = "absolute";
      textArea.style.left = "-999999px";
      document.body.prepend(textArea);
      textArea.select();
      try {
        // This is identified as deprecated https://developer.mozilla.org/en-US/docs/Web/API/Document/execCommand
        // though no standard has replaced it and the "copy" command is supported
        // in all browsers.
        document.execCommand("copy");
      } catch (error) {
        console.error(error);
      } finally {
        textArea.remove();
      }
    }
  };

  const copyToClipboard = async (
    content: string,
    contentTime = COPY_STATE_RESET_DURATION,
  ) => {
    try {
      setCopying(true);
      await copyWithFallback(content);
      setCopied(true);
      setCopying(false);
    } catch (error) {
      setCopied(false);
      setCopying(false);
      throw new Error(`Error copying to clipboard: ${error as string}`);
    } finally {
      setTimeout(() => {
        setCopied(false);
      }, contentTime); // Reset copied state
    }
  };

  return { copied, copying, copyToClipboard };
};

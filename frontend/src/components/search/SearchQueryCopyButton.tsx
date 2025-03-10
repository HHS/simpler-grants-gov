"use client";

import { useCopyToClipboard } from "src/hooks/useCopyToClipboard";
import { useSnackbar } from "src/hooks/useSnackbar";

import { ReactNode } from "react";
import { Button } from "@trussworks/react-uswds";

import { USWDSIcon } from "src/components/USWDSIcon";

const SNACKBAR_VISIBLE_TIME = 6000;

type SearchQueryCopyButtonProps = {
  copyText: string;
  copyingText: string;
  copiedText: string;
  url: string;
  snackbarMessage: ReactNode;
  children: ReactNode;
};

const SearchQueryCopyButton = ({
  copyText,
  copyingText,
  copiedText,
  url,
  snackbarMessage,
  children,
}: SearchQueryCopyButtonProps) => {
  const { copied, copying, copyToClipboard } = useCopyToClipboard();
  const { hideSnackbar, snackbarIsVisible, showSnackbar, Snackbar } =
    useSnackbar();

  return (
    <span className="flex-1">
      <Button
        className="padding-05"
        data-testid="save-search-query"
        type="button"
        unstyled
        onClick={() => {
          copyToClipboard(url, SNACKBAR_VISIBLE_TIME)
            .then(() => {
              showSnackbar(SNACKBAR_VISIBLE_TIME);
            })
            .catch((error) => {
              console.error(error);
            });
        }}
      >
        <USWDSIcon name="content_copy" />
        {copying ? <>{copyingText}</> : <>{copied ? copiedText : copyText}</>}
      </Button>
      {children}
      <Snackbar close={hideSnackbar} isVisible={snackbarIsVisible}>
        {snackbarMessage}
      </Snackbar>
    </span>
  );
};

export default SearchQueryCopyButton;

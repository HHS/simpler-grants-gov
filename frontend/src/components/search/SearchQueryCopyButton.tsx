"use client";

import { useCopyToClipboard } from "src/hooks/useCopyToClipboard";
import { useSnackbar } from "src/hooks/useSnackbar";

import { ReactNode } from "react";
import { Button } from "@trussworks/react-uswds";

import { USWDSIcon } from "src/components/USWDSIcon";

type SearchQueryCopyButtonProps = {
  copyText: string;
  copyingText: string;
  copiedText: string;
  url: string;
  snackbarMessage: ReactNode;
  children?: ReactNode;
};

const SearchQueryCopyButton = ({
  copyText,
  copyingText,
  copiedText,
  url,
  snackbarMessage,
  children, // to be used for tooltip
}: SearchQueryCopyButtonProps) => {
  const { copied, copying, copyToClipboard } = useCopyToClipboard();
  const { hideSnackbar, snackbarIsVisible, showSnackbar, Snackbar } =
    useSnackbar();

  return (
    <span className="flex-1">
      <Button
        className="padding-1 hover:bg-base-lightest"
        data-testid="save-search-query"
        type="button"
        unstyled
        onClick={() => {
          copyToClipboard(url)
            .then(() => {
              showSnackbar();
            })
            .catch((e) => {
              console.error(e);
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

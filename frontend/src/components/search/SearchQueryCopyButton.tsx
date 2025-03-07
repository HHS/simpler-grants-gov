"use client";

import { useCopyToClipboard } from "src/hooks/useCopyToClipboard";
import { useSnackbar } from "src/hooks/useSnackbar";

import dynamic from "next/dynamic";
import { ReactNode } from "react";
import { Button } from "@trussworks/react-uswds";

import { USWDSIcon } from "src/components/USWDSIcon";

const TooltipWrapper = dynamic(() => import("src/components/TooltipWrapper"), {
  ssr: false,
  loading: () => <USWDSIcon className="margin-left-1" name="info_outline" />,
});

const SNACKBAR_VISIBLE_TIME = 60000;

type SearchQueryCopyButtonProps = {
  copyText: string;
  copyingText: string;
  copiedText: string;
  helpText: ReactNode;
  url: string;
  snackbarMessage: ReactNode;
};

const SearchQueryCopyButton = ({
  copyText,
  copyingText,
  copiedText,
  helpText,
  url,
  snackbarMessage,
}: SearchQueryCopyButtonProps) => {
  const { copied, copying, copyToClipboard } = useCopyToClipboard();
  const { hideSnackbar, snackbarIsVisible, showSnackbar, Snackbar } =
    useSnackbar();

  return (
    <>
      <Button
        data-testid="save-search-query"
        type="button"
        unstyled
        onClick={() => {
          copyToClipboard(url, SNACKBAR_VISIBLE_TIME)
            .then(() => {
              showSnackbar(SNACKBAR_VISIBLE_TIME);
            })
            .catch((error) => {
              console.error("Error copying to clipboard:", error);
            });
        }}
      >
        <USWDSIcon name="content_copy" />
        {copying ? <>{copyingText}</> : <>{copied ? copiedText : copyText}</>}
      </Button>
      <TooltipWrapper
        className="margin-left-1 usa-button--unstyled"
        label={helpText}
        position="top"
      >
        <USWDSIcon className=" text-secondary-darker" name="info_outline" />
      </TooltipWrapper>
      <Snackbar close={hideSnackbar} isVisible={snackbarIsVisible}>
        {snackbarMessage}
      </Snackbar>
    </>
  );
};

export default SearchQueryCopyButton;

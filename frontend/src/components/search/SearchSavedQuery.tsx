"use client";

import { useCopyToClipboard } from "src/hooks/useCopyToClipboard";
import { useSnackbar } from "src/hooks/useSnackbar";

import { Button, Tooltip } from "@trussworks/react-uswds";

import { USWDSIcon } from "src/components/USWDSIcon";

const SNACKBAR_VISIBLE_TIME = 4000;

type SearchSavedQueryProps = {
  copyText: string;
  copyingText: string;
  copiedText: string;
  helpText: string;
  url: string;
  snackbarMessage: React.ReactNode | string;
};

const SearchSavedQuery = ({
  copyText,
  copyingText,
  copiedText,
  helpText,
  url,
  snackbarMessage,
}: SearchSavedQueryProps) => {
  const { copied, loading, copyToClipboard } = useCopyToClipboard();
  const { snackbarIsVisible, showSnackbar, Snackbar } = useSnackbar();

  return (
    <div>
      <div className="text-underline border-base-lighter border-1px padding-2 text-primary-darker display-flex">
        <Button
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
          {loading ? (
            <>{copyingText}</>
          ) : (
            <>{copied ? { copiedText } : copyText}</>
          )}
        </Button>
        <Tooltip
          className="text-secondary-darker usa-button--unstyled"
          label={helpText}
          position="top"
        >
          <USWDSIcon className="margin-left-1" name="info_outline" />
        </Tooltip>
      </div>
      <Snackbar isVisible={snackbarIsVisible}>{snackbarMessage}</Snackbar>
    </div>
  );
};

export default SearchSavedQuery;

"use client";

import { useCopyToClipboard } from "src/hooks/useCopyToClipboard";
import { Button, Tooltip } from "@trussworks/react-uswds";
import { usePathname, useSearchParams } from "next/navigation";
import { USWDSIcon } from "src/components/USWDSIcon";
import { environment } from "src/constants/environments";
type SearchSavedQueryProps = {
  copyText: string;
  helpText: string;
};
const SearchSavedQuery2 = ({ copyText, helpText }: SearchSavedQueryProps) => {
  const { copied, loading, copyToClipboard } = useCopyToClipboard();
  const path = usePathname();
  const searchParams = useSearchParams();
  const url = `${environment.NEXT_PUBLIC_BASE_URL}${path}?${searchParams.toString()}`;
  return (
    <div className="text-underline border-base-lighter border-1px padding-2 text-primary-darker display-flex">
      <Button type="button" unstyled
      // eslint-disable-next-line @typescript-eslint/no-misused-promises
      onClick={() => copyToClipboard(url)}>
        <USWDSIcon name="content_copy" />
        { loading ? (
          "Copying..."
        ) : (
          <>{copied ? "Copied!" : copyText}</>
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
  );
};

export default SearchSavedQuery2;

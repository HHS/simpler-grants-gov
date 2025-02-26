"use client";

import Tooltip from "src/components/Tooltip";
import { USWDSIcon } from "src/components/USWDSIcon";

type SearchSavedQueryProps = {
  copyText: string;
  helpText: string;
};

const SearchSavedQuery = ({ copyText, helpText }: SearchSavedQueryProps) => {
  return (
    <div className="border-base-lighter border-1px padding-2">
      {copyText}
      <USWDSIcon className="text-primary-darker" name="content_copy" />
      <Tooltip label={helpText} position="top">
        <USWDSIcon name="info_outline" />
      </Tooltip>
    </div>
  );
};

export default SearchSavedQuery;

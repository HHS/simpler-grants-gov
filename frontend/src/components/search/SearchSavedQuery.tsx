"use client";

import Tooltip from "src/components/Tooltip";
import { USWDSIcon } from "src/components/USWDSIcon";

type SearchSavedQueryProps = {
  copyText: string;
  helpText: string;
};

const SearchSavedQuery = ({ copyText, helpText }: SearchSavedQueryProps) => {
  return (
    <div className="text-underline border-base-lighter border-1px padding-2 text-primary-darker display-flex">
      <USWDSIcon className="margin-right-1" name="content_copy" />
      {copyText}
      <Tooltip
        className="text-secondary-darker"
        label={helpText}
        position="top"
      >
        <USWDSIcon className="margin-left-1" name="info_outline" />
      </Tooltip>
    </div>
  );
};

export default SearchSavedQuery;

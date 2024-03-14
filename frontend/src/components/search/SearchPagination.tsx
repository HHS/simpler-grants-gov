import React, { useState } from "react";

import { Pagination } from "@trussworks/react-uswds";
import { useSearchParamUpdater } from "../../hooks/useSearchParamUpdater";

interface SearchPaginationProps {
  page: number;
  formRef: React.RefObject<HTMLFormElement>;
  showHiddenInput?: boolean; // Only one of the two SearchPagination should have this set
  totalPages: number;
}

const MAX_SLOTS = 5;

export default function SearchPagination({
  page = 1,
  formRef,
  showHiddenInput,
  totalPages,
}: SearchPaginationProps) {
  const { updateQueryParams } = useSearchParamUpdater();
  const [currentPage, setCurrentPage] = useState<number>(
    getSafeCurrentPage(page, totalPages),
  );

  const currentPageInputRef = React.useRef<HTMLInputElement>(null);

  const handlePageChange = (page: number) => {
    const queryParamKey = "page";
    updateQueryParams(page.toString(), queryParamKey);
    if (currentPageInputRef.current) {
      currentPageInputRef.current.value = page.toString();
    }

    formRef?.current?.requestSubmit();
    setCurrentPage(getSafeCurrentPage(page, totalPages));
  };

  return (
    <>
      {showHiddenInput === true && (
        // Allows us to pass a value to server action when updating results
        <input type="hidden" name="currentPage" ref={currentPageInputRef} />
      )}
      <Pagination
        pathname="/search"
        totalPages={totalPages}
        currentPage={currentPage}
        maxSlots={MAX_SLOTS}
        onClickNext={() => handlePageChange(currentPage + 1)}
        onClickPrevious={() => handlePageChange(currentPage - 1)}
        onClickPageNumber={(event, page) => handlePageChange(page)}
      />
    </>
  );
}

function getSafeCurrentPage(page: number, TOTAL_PAGES: number) {
  return Math.max(1, Math.min(page, TOTAL_PAGES));
}

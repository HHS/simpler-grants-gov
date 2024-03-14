import React, { useState } from "react";

import { Pagination } from "@trussworks/react-uswds";
import { useSearchParamUpdater } from "../../hooks/useSearchParamUpdater";

interface SearchPaginationProps {
  page: number;
  formRef: React.RefObject<HTMLFormElement>;
  showHiddenInput?: boolean;
}

const TOTAL_PAGES = 44;
const MAX_SLOTS = 5;

export default function SearchPagination({
  page = 1,
  formRef,
  showHiddenInput,
}: SearchPaginationProps) {
  console.log("page in searchpagination => ", page);
  const { updateQueryParams } = useSearchParamUpdater();
  const [currentPage, setCurrentPage] = useState<number>(
    getSafeCurrentPage(page, TOTAL_PAGES),
  );

  const handlePageChange = (page: number) => {
    console.log("page in handlePageChange => ", page);
    const queryParamKey = "page";
    updateQueryParams(page.toString(), queryParamKey);
    formRef?.current?.requestSubmit();
    setCurrentPage(getSafeCurrentPage(page, TOTAL_PAGES));
  };

  return (
    <>
      {showHiddenInput === true && (
        <input type="hidden" name="currentPage" value={currentPage} />
      )}
      <Pagination
        pathname="/search"
        totalPages={TOTAL_PAGES}
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

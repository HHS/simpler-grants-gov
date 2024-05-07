"use client";

import { Pagination } from "@trussworks/react-uswds";

interface SearchPaginationProps {
  showHiddenInput?: boolean; // Only one of the two SearchPagination should have this set
  page: number;
  handlePageChange: (handlePage: number) => void; // managed in useSearchFormState
  paginationRef?: React.RefObject<HTMLInputElement>; // managed in useSearchFormState
}

const MAX_SLOTS = 5;

export default function SearchPagination({
  showHiddenInput,
  page,
  handlePageChange,
  paginationRef,
}: SearchPaginationProps) {
  return (
    <>
      {showHiddenInput === true && (
        // Allows us to pass a value to server action when updating results
        <input
          type="hidden"
          name="currentPage"
          ref={paginationRef}
          value={page}
          data-testid="hiddenCurrentPage"
        />
      )}
      <Pagination
        pathname="/search"
        currentPage={page}
        maxSlots={MAX_SLOTS}
        onClickNext={() => handlePageChange(page + 1)}
        onClickPrevious={() => handlePageChange(page - 1)}
        onClickPageNumber={(event, page) => handlePageChange(page)}
      />
    </>
  );
}

"use client";

import { Pagination } from "@trussworks/react-uswds";
import { useFormStatus } from "react-dom";

export enum PaginationType {
  Top = "topPagination",
  Bottom = "bottomPagination",
}

interface SearchPaginationProps {
  showHiddenInput?: boolean; // Only one of the two SearchPagination should have this set
  totalPages: number;
  page: number;
  handlePageChange: (handlePage: number) => void; // managed in useSearchFormState
  paginationRef?: React.RefObject<HTMLInputElement>; // managed in useSearchFormState
  type: PaginationType;
}

const MAX_SLOTS = 5;

export default function SearchPagination({
  showHiddenInput,
  totalPages,
  page,
  handlePageChange,
  paginationRef,
  type,
}: SearchPaginationProps) {
  const { pending } = useFormStatus();

  if (pending && type === PaginationType.Bottom) {
    return null;
  }
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
        totalPages={totalPages}
        currentPage={page}
        maxSlots={MAX_SLOTS}
        onClickNext={() => handlePageChange(page + 1)}
        onClickPrevious={() => handlePageChange(page - 1)}
        onClickPageNumber={(event, page) => handlePageChange(page)}
      />
    </>
  );
}

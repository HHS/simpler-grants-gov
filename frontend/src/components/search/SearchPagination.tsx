"use client";

import React, { Dispatch, SetStateAction, useEffect, useState } from "react";

import { Pagination } from "@trussworks/react-uswds";
import { useSearchParamUpdater } from "../../hooks/useSearchParamUpdater";

interface SearchPaginationProps {
  initialQueryParams: number;
  formRef: React.RefObject<HTMLFormElement>;
  showHiddenInput?: boolean; // Only one of the two SearchPagination should have this set
  totalPages: number;
  setFieldChanged: Dispatch<SetStateAction<string>>;
  fieldChanged: string;
  resetPagination: boolean;
}

const MAX_SLOTS = 5;
const queryParamKey = "page";

export default function SearchPagination({
  initialQueryParams = 1,
  formRef,
  showHiddenInput,
  totalPages,
  setFieldChanged,
  fieldChanged,
  resetPagination,
}: SearchPaginationProps) {
  const { updateQueryParams } = useSearchParamUpdater();
  const [currentPage, setCurrentPage] = useState<number>(
    getSafeCurrentPage(initialQueryParams, totalPages),
  );

  console.log("SearchPagination currentPAge => ", currentPage);

  const currentPageInputRef = React.useRef<HTMLInputElement>(null);

  const handlePageChange = (page: number) => {
    // console.log("handlePageChange in SearchPagination");
    setFieldChanged("pagination");

    updateQueryParams(page.toString(), queryParamKey);
    if (currentPageInputRef.current) {
      currentPageInputRef.current.value = page.toString();
    }
    setCurrentPage(getSafeCurrentPage(page, totalPages));
    // formRef?.current?.requestSubmit();
  };

  useEffect(() => {
    // set the fieldChanged so we know to call 1 from the API
    if (fieldChanged === "pagination") {
      formRef?.current?.requestSubmit();
    }
  }, [fieldChanged, formRef]);

  useEffect(() => {
    if (resetPagination) {
      updateQueryParams("", queryParamKey); // clear query params
      setCurrentPage(1); // reset to the first page
    }
    // eslint-disable react-hooks/exhaustive-deps
  }, [resetPagination]);

  return (
    <>
      {showHiddenInput === true && (
        // Allows us to pass a value to server action when updating results
        <input
          type="hidden"
          name="currentPage"
          ref={currentPageInputRef}
          value={currentPage}
        />
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
  const answer = Math.max(1, Math.min(page, TOTAL_PAGES));
  return answer;
}

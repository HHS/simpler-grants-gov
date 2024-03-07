import { Pagination } from "@trussworks/react-uswds";
import React from "react";

/* eslint-disable no-alert */

export default function SearchPagination() {
  return (
    <Pagination
      pathname="/search"
      totalPages={44}
      currentPage={2}
      maxSlots={5}
      onClickNext={() => alert("Next page")}
      onClickPrevious={() => alert("Previous page")}
      onClickPageNumber={(event, page) => alert(`Navigate to page ${page}`)}
    />
  );
}

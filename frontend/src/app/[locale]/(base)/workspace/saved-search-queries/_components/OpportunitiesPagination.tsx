// This component manages pagination state using URL query params, in order to avoid
// client side state management and trigger render lifecycle actions organically
"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Pagination } from "@trussworks/react-uswds";

type PaginationProps = {
  totalPages: number;
};

export default function OpportunitiesPagination({
  totalPages,
}: PaginationProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Extract current page from URL query string, default to page 1
  const currentPage = Number(searchParams.get("page")) || 1;

  const handlePageClick = (pageNumber: number) => {
    // Update the client-side URL parameters
    // this will trigger a page refresh and load another page of data
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", pageNumber.toString());
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div>
      <Pagination
        totalPages={totalPages}
        currentPage={currentPage}
        pathname={pathname}
        onClickPageNumber={(e, page) => {
          e.preventDefault();
          handlePageClick(page);
        }}
        onClickNext={() => {
          handlePageClick(currentPage + 1);
        }}
        onClickPrevious={() => {
          handlePageClick(currentPage - 1);
        }}
      />
    </div>
  );
}

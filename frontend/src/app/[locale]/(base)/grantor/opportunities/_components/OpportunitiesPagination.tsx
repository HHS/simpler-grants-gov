// This component uses the URL because it is the industry-standard "best practice"
// for server-side pages (the parent or calling component).
"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
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
  const [isPending, startTransition] = useTransition();

  // Extract current page from URL query string, default to page 1
  const currentPage = Number(searchParams.get("page")) || 1;

  const handlePageClick = (pageNumber: number) => {
    startTransition(() => {
      // Update the client-side URL parameters
      // this will trigger a page refresh and load another page of data
      const params = new URLSearchParams(searchParams.toString());
      params.set("page", pageNumber.toString());
      router.push(`${pathname}?${params.toString()}`);
    });
  };

  return (
    <div
      data-testid="pagination-transition-wrapper"
      style={{ opacity: isPending ? 0.6 : 1, transition: "opacity 0.2s" }}
    >
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

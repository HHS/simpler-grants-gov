// This component uses the URL because it is the industry-standard "best practice"
// for server-side pages (the parent or calling component).
"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { Pagination } from "@trussworks/react-uswds";

interface UswdsPaginationProps {
  totalPages: number;
  // The server action function passed from the server-side page
  onPageChangeAction: (page: number) => Promise<void>;
}

export default function UswdsPagination({
  totalPages,
  onPageChangeAction,
}: UswdsPaginationProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  // Extract current page from URL query string, default to page 1
  const currentPage = Number(searchParams.get("page")) || 1;

  const handlePageClick = (pageNumber: number) => {
    // 1. Trigger the server-side action inside a transition
    startTransition(async () => {
      await onPageChangeAction(pageNumber);

      // 2. Update the client-side URL parameters after server loads data
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
        onClickNext={(e) => {
          (e as React.MouseEvent<HTMLButtonElement>).preventDefault();
          handlePageClick(currentPage + 1);
        }}
        onClickPrevious={(e) => {
          (e as React.MouseEvent<HTMLButtonElement>).preventDefault();
          handlePageClick(currentPage - 1);
        }}
      />
    </div>
  );
}

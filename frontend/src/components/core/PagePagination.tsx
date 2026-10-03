"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Pagination } from "@trussworks/react-uswds";

type PagePaginationProps = {
  totalPages: number;
};

export default function PagePagination({ totalPages }: PagePaginationProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const pageParam = Number(searchParams.get("page"));
  const currentPage =
    Number.isInteger(pageParam) && pageParam > 0 ? pageParam : 1;

  const handlePageClick = (pageNumber: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", pageNumber.toString());
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <Pagination
      totalPages={totalPages}
      currentPage={currentPage}
      pathname={pathname}
      onClickPageNumber={(event, page) => {
        event.preventDefault();
        handlePageClick(page);
      }}
      onClickNext={() => handlePageClick(currentPage + 1)}
      onClickPrevious={() => handlePageClick(currentPage - 1)}
    />
  );
}

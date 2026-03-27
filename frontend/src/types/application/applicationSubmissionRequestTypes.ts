export type ApplicationSubmissionsOrderBy = "created_at";

export type ApplicationSubmissionsSortOrder = {
  order_by: ApplicationSubmissionsOrderBy;
  sort_direction: "ascending" | "descending";
}[];

export interface ApplicationSubmissionsPagination {
  page_offset: number;
  page_size: number;
  sort_order: ApplicationSubmissionsSortOrder;
}

export interface ApplicationSubmissionsRequestBody {
  pagination: ApplicationSubmissionsPagination;
}

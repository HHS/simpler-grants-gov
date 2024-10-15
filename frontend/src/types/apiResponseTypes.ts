export interface PaginationInfo {
  order_by: string;
  page_offset: number;
  page_size: number;
  sort_direction: string;
  total_pages: number;
  total_records: number;
}

export interface APIResponse {
  data: unknown[] | object;
  message: string;
  status_code: number;
  pagination_info?: PaginationInfo;
  warnings?: unknown[] | null | undefined;
  errors?: unknown[] | null | undefined;
}

import type { APIResponse, PaginationInfo } from "src/types/apiResponseTypes";

type OkResponseOptions = {
  message?: string;
  status_code?: number;
  pagination_info?: PaginationInfo;
  warnings?: APIResponse["warnings"];
  errors?: APIResponse["errors"];
};

export function okResponse<TData extends APIResponse["data"]>(
  data: TData,
  options: OkResponseOptions = {},
): APIResponse & { data: TData } {
  return {
    data,
    message: options.message ?? "ok",
    status_code: options.status_code ?? 200,
    pagination_info: options.pagination_info,
    warnings: options.warnings,
    errors: options.errors,
  };
}
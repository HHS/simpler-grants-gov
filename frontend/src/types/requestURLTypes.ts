export interface ServerSideRouteParams {
  slug: string;
}

export interface ServerSideSearchParams {
  [key: string]: string | string[] | undefined;
}

export interface ConvertedSearchParams {
  [key: string]: string;
}

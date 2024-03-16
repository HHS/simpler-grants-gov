// Route param prop for app router server-side pages
export interface ServerSideRouteParams {
  slug: string;
}

// Query param prop for app router server-side pages
export interface ServerSideSearchParams {
  [key: string]: string | undefined;
}

// Converted
// IE... query becomes a string, page becomes a number
export interface ConvertedSearchParams {
  query: string;
  sortby: string;
  status: string;
  page: number;
}

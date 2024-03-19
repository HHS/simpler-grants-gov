// Route param prop for app router server-side pages
export interface ServerSideRouteParams {
  slug: string;
}

// Query param prop for app router server-side pages
export interface ServerSideSearchParams {
  [key: string]: string | undefined;
}

// Converted search param types
// IE... query becomes a string, page becomes a number
export interface ConvertedSearchParams {
  page: number;
  query: string;
  sortby: string;
  status: string;
  agency: string;
  fundingInstrument: string;
}

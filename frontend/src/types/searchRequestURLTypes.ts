// Route param prop for app router server-side pages
export interface ServerSideRouteParams {
  slug: string;
}

// Query param prop for app router server-side pages
export interface ServerSideSearchParams {
  [key: string]: string | undefined;
}

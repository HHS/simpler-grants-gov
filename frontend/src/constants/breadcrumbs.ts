import { Breadcrumb } from "src/components/Breadcrumbs";

const HOME: Breadcrumb = { title: "Home", path: "/" };
const SUBSCRIBE: Breadcrumb = { title: "Subscribe", path: "/subscribe/" };
const SEARCH: Breadcrumb = {
  title: "Search",
  path: "/search",
};
export const SUBSCRIBE_CONFIRMATION: Breadcrumb = {
  title: "Confirmation",
  path: "/subscribe/confirmation/",
};
const UNSUBSCRIBE: Breadcrumb = {
  title: "Unsubscribe",
  path: "/subscribe/unsubscribe/",
};
const SAVED_OPPORTUNITIES: Breadcrumb = {
  title: "Saved opportunities",
  path: "/saved-opportunities/",
};

const SAVED_SEARCHES: Breadcrumb = {
  title: "Saved search queries",
  path: "/saved-search-queries/",
};

export const SUBSCRIBE_CRUMBS: Breadcrumb[] = [HOME, SUBSCRIBE];
export const SUBSCRIBE_CONFIRMATION_CRUMBS: Breadcrumb[] = [
  HOME,
  SUBSCRIBE,
  SUBSCRIBE_CONFIRMATION,
];
export const UNSUBSCRIBE_CRUMBS: Breadcrumb[] = [HOME, SUBSCRIBE, UNSUBSCRIBE];
export const SEARCH_CRUMBS: Breadcrumb[] = [HOME, SEARCH];
export const OPPORTUNITY_CRUMBS: Breadcrumb[] = [HOME, SEARCH];
export const SAVED_OPPORTUNITIES_CRUMBS: Breadcrumb[] = [
  HOME,
  SAVED_OPPORTUNITIES,
];
export const SAVED_SEARCHES_CRUMBS: Breadcrumb[] = [HOME, SAVED_SEARCHES];

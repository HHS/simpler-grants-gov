import { Breadcrumb } from "src/components/Breadcrumbs";

// individual breadcrumbs
const HOME: Breadcrumb = { title: "Home", path: "/" };
const SEARCH: Breadcrumb = {
  title: "Search",
  path: "/search",
};
const SAVED_OPPORTUNITIES: Breadcrumb = {
  title: "Saved opportunities",
  path: "/saved-opportunities/",
};
const SAVED_SEARCHES: Breadcrumb = {
  title: "Saved search queries",
  path: "/saved-search-queries/",
};
const ACTIVITY_DASHBOARD: Breadcrumb = {
  title: "Activity Dashboard",
  path: "/dashboard",
};

// page breadcrumbs
export const SEARCH_CRUMBS: Breadcrumb[] = [HOME, SEARCH];
export const OPPORTUNITY_CRUMBS: Breadcrumb[] = [HOME, SEARCH];
export const SAVED_OPPORTUNITIES_CRUMBS: Breadcrumb[] = [
  HOME,
  SAVED_OPPORTUNITIES,
];
export const SAVED_SEARCHES_CRUMBS: Breadcrumb[] = [HOME, SAVED_SEARCHES];
export const ACTIVITY_DASHBOARD_CRUMBS: Breadcrumb[] = [
  HOME,
  ACTIVITY_DASHBOARD,
];

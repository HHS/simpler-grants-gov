import { Breadcrumb } from "src/components/Breadcrumbs";

// individual breadcrumbs
const HOME: Breadcrumb = { title: "Home", path: "/" };
const SEARCH: Breadcrumb = {
  title: "Search",
  path: "/search",
};
const SAVED_SEARCHES: Breadcrumb = {
  title: "Saved search queries",
  path: "/saved-search-queries/",
};

// page breadcrumbs
export const SEARCH_CRUMBS: Breadcrumb[] = [HOME, SEARCH];
export const SAVED_SEARCHES_CRUMBS: Breadcrumb[] = [HOME, SAVED_SEARCHES];

import { Breadcrumb } from "src/components/Breadcrumbs";

// individual breadcrumbs
const HOME: Breadcrumb = { title: "Home", path: "/" };
const SEARCH: Breadcrumb = {
  title: "Search",
  path: "/search",
};

// page breadcrumbs
export const SEARCH_CRUMBS: Breadcrumb[] = [HOME, SEARCH];

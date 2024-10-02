import { Breadcrumb, BreadcrumbList } from "src/components/Breadcrumbs";

const HOME: Breadcrumb = { title: "Home", path: "/" };
const RESEARCH: Breadcrumb = { title: "Research", path: "/research/" };
const PROCESS: Breadcrumb = { title: "Process", path: "/process/" };
const NEWSLETTER: Breadcrumb = { title: "Subscribe", path: "/newsletter/" };
const SEARCH: Breadcrumb = {
  title: "Search",
  path: "/search?status=forecasted,posted",
};
export const NEWSLETTER_CONFIRMATION: Breadcrumb = {
  title: "Confirmation",
  path: "/newsletter/confirmation/",
};
const NEWSLETTER_UNSUBSCRIBE: Breadcrumb = {
  title: "Unsubscribe",
  path: "/newsletter/unsubscribe/",
};

export const RESEARCH_CRUMBS: BreadcrumbList = [HOME, RESEARCH];
export const PROCESS_CRUMBS: BreadcrumbList = [HOME, PROCESS];
export const NEWSLETTER_CRUMBS: BreadcrumbList = [HOME, NEWSLETTER];
export const NEWSLETTER_CONFIRMATION_CRUMBS: BreadcrumbList = [
  HOME,
  NEWSLETTER,
  NEWSLETTER_CONFIRMATION,
];
export const NEWSLETTER_UNSUBSCRIBE_CRUMBS: BreadcrumbList = [
  HOME,
  NEWSLETTER,
  NEWSLETTER_UNSUBSCRIBE,
];
export const SEARCH_CRUMBS: BreadcrumbList = [HOME, SEARCH];
export const OPPORTUNITY_CRUMBS: BreadcrumbList = [HOME, SEARCH];

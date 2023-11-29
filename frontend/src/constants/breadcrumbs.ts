import { Breadcrumb, BreadcrumbList } from "src/components/Breadcrumbs";

const HOME: Breadcrumb = {title: "Home", path: "/"}
const RESEARCH: Breadcrumb = {title: "Research", path: "research/"}
const PROCESS: Breadcrumb = {title: "Process", path: "process/"}

export const RESEARCH_CRUMBS: BreadcrumbList = [HOME, RESEARCH]
export const PROCESS_CRUMBS: BreadcrumbList = [HOME, PROCESS]
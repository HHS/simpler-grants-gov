import { SAVED_SEARCHES_CRUMBS } from "src/constants/breadcrumbs";
import { LayoutProps } from "src/types/generalTypes";

import Breadcrumbs from "src/components/Breadcrumbs";
import { SessionCheck } from "src/components/user/SessionCheck";

export default function SavedSearchesLayout({ children }: LayoutProps) {
  return (
    <>
      <Breadcrumbs breadcrumbList={SAVED_SEARCHES_CRUMBS} />
      <SessionCheck />
      {children}
    </>
  );
}

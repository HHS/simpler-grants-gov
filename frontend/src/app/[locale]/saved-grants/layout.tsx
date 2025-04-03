import { SAVED_GRANTS_CRUMBS } from "src/constants/breadcrumbs";
import { LayoutProps } from "src/types/generalTypes";

import Breadcrumbs from "src/components/Breadcrumbs";

export default function SavedGrantsLayout({ children }: LayoutProps) {
  return (
    <>
      <Breadcrumbs breadcrumbList={SAVED_GRANTS_CRUMBS} />
      {children}
    </>
  );
}

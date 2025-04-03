import { SAVED_GRANTS_CRUMBS } from "src/constants/breadcrumbs";
import { LayoutProps } from "src/types/generalTypes";

import Breadcrumbs from "src/components/Breadcrumbs";
import { AuthenticationGate } from "src/components/user/AuthenticationGate";

export default function SavedGrantsLayout({ children }: LayoutProps) {
  return (
    <>
      <Breadcrumbs breadcrumbList={SAVED_GRANTS_CRUMBS} />
      <AuthenticationGate>{children}</AuthenticationGate>
    </>
  );
}

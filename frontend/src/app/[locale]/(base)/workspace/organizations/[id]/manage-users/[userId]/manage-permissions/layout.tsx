import { LayoutProps } from "src/types/generalTypes";

import { NavigationGuardProvider } from "next-navigation-guard";

// Required by useNavigationGuard, which warns about unsaved permission changes
export default function ManagePermissionsLayout({ children }: LayoutProps) {
  return <NavigationGuardProvider>{children}</NavigationGuardProvider>;
}

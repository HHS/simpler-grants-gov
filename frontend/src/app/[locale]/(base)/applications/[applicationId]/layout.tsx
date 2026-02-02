import { LayoutProps } from "src/types/generalTypes";

import { NavigationGuardProvider } from "next-navigation-guard";

export default function ApplicationLayout({ children }: LayoutProps) {
  return <NavigationGuardProvider>{children}</NavigationGuardProvider>;
}

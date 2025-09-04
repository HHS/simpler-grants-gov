import { LayoutProps } from "src/types/generalTypes";

import { NavigationGuardProvider } from "next-navigation-guard";

export default function ApplicaitonsLayout({ children }: LayoutProps) {
  return <NavigationGuardProvider>{children}</NavigationGuardProvider>;
}

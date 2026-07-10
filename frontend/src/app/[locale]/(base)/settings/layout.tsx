import { LayoutProps } from "src/types/generalTypes";

import { AuthenticationGate } from "src/components/core/AuthenticationGate";

export default function UserLayout({ children }: LayoutProps) {
  return <AuthenticationGate>{children}</AuthenticationGate>;
}

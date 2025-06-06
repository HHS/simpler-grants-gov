import { LayoutProps } from "src/types/generalTypes";

import { AuthenticationGate } from "src/components/user/AuthenticationGate";

export default function FormLayout({ children }: LayoutProps) {
  return (
    <>
      <AuthenticationGate>{children}</AuthenticationGate>
    </>
  );
}

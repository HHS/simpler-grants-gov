import { LayoutProps } from "src/types/generalTypes";

import BetaAlert from "src/components/BetaAlert";
import { AuthenticationGate } from "src/components/user/AuthenticationGate";

export default function WorkspaceLayout({ children }: LayoutProps) {
  return (
    <>
      <AuthenticationGate>
        <BetaAlert containerClasses="margin-bottom-5" />
        {children}
      </AuthenticationGate>
    </>
  );
}

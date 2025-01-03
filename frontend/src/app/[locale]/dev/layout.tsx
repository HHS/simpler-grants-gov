import UserProvider from "src/services/auth/UserProvider";

import React from "react";

export default function Layout({ children }: { children: React.ReactNode }) {
  return <UserProvider>{children}</UserProvider>;
}

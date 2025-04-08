"use client";

import { useUser } from "src/services/auth/useUser";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect } from "react";

export const useRouteChange = (onRouteChange: () => void) => {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { refreshUser } = useUser();

  useEffect(() => {
    onRouteChange();
  }, [pathname, searchParams, refreshUser]);
};

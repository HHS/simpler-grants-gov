"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect } from "react";

export const useRouteChange = (onRouteChange: () => void) => {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    onRouteChange();
  }, [pathname, searchParams, onRouteChange]);
};

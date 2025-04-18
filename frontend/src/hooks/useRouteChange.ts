"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect } from "react";

export const useRouteChange = (onRouteChange: () => void | Promise<void>) => {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    // the change handler can be either sync or async, and the type system is annoyed about that
    // as this is a side effect that goes out into the ether, it doesn't matter. disabling eslint
    // eslint-disable-next-line
    onRouteChange();
  }, [pathname, searchParams, onRouteChange]);
};

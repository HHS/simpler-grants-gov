"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

// Extracts the applicationId from the current route path

export const useApplicationId = (): string | null => {
  const pathname = usePathname();
  const [applicationId, setApplicationId] = useState<string | null>(null);

  useEffect(() => {
    if (!pathname) return;

    const match = pathname.match(
      /\/applications\/application\/([a-f0-9-]+)\/form\//,
    );
    if (match?.[1]) {
      setApplicationId(match[1]);
    }
  }, [pathname]);

  return applicationId;
};

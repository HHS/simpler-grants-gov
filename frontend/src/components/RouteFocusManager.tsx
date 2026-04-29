"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

type RouteFocusManagerProps = {
  children: React.ReactNode;
};

export default function RouteFocusManager({
  children,
}: RouteFocusManagerProps): React.JSX.Element {
  const pathname = usePathname();
  const hasMountedReference = useRef<boolean>(false);

  useEffect(() => {
    if (!hasMountedReference.current) {
      hasMountedReference.current = true;
      return;
    }

    const mainContentElement = document.getElementById("main-content");

    if (mainContentElement instanceof HTMLElement) {
      mainContentElement.focus();
    }
  }, [pathname]);

  return <>{children}</>;
}

"use client";

import { environment } from "src/constants/environments";
import { injectableScriptConfig } from "src/utils/injectableScripts";

import { usePathname } from "next/navigation";

export function ClientScriptInjector() {
  const path = usePathname();
  const activeScripts = Object.values(injectableScriptConfig).map(
    ({ tag, gate }) => {
      return gate(path, environment) ? tag : "";
    },
  );
  return <>{activeScripts}</>;
}

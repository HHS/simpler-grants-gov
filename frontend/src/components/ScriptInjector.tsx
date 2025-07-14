"use client";

import { environment } from "src/constants/environments";

import { usePathname } from "next/navigation";
import Script from "next/script";

const scripts = {
  ethnio: {
    tag: (
      <Script
        src="https://ethn.io/91732.js"
        async={true}
        type="text/javascript"
        key="ethnio"
      />
    ),
    gate: (path: string, env: typeof environment) => {
      return path.includes("/search") && env.IS_CI !== "true";
    },
  },
};

export function ClientScriptInjector() {
  const path = usePathname();
  const activeScripts = Object.values(scripts).map(({ tag, gate }) => {
    return gate(path, environment) ? tag : "";
  });
  return <>{activeScripts}</>;
}

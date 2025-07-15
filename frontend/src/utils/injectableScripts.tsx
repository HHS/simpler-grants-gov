import { environment } from "src/constants/environments";

import Script from "next/script";

export const injectableScriptConfig = {
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

import { defineConfig } from "orval";

export default defineConfig({
  apiZod: {
    input: {
      target: "../api/openapi.generated.yml",
    },
    output: {
      client: "zod",
      mode: "single",
      target: "./src/generated/apiSchemas.zod.ts",
      override: {
        zod: {
          version: 3,
          variant: "classic",
          generateReusableSchemas: true,
        },
      },
    },
  },
});

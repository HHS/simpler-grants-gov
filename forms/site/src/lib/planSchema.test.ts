import { readdirSync, readFileSync } from "node:fs";
import { expect, it } from "vitest";

import { formSchema } from "./formPlanSchema";

it("validates the whole maintained catalog without importing Astro", () => {
  const folder = new URL("../content/forms/", import.meta.url);
  for (const name of readdirSync(folder).filter((name) =>
    name.endsWith(".json"),
  )) {
    const parsed = formSchema.safeParse(
      JSON.parse(readFileSync(new URL(name, folder), "utf8")),
    );
    expect(
      parsed.success,
      name + (parsed.success ? "" : JSON.stringify(parsed.error.issues)),
    ).toBe(true);
  }
});
it("rejects object constraints rather than silently accepting an incompatible plan format", () => {
  expect(
    formSchema.safeParse({
      title: "Example",
      slug: "example",
      status: "backlog",
      children: [
        {
          kind: "field",
          label: "Amount",
          type: "Number input",
          required: false,
          constraints: { multipleOf: 0.01 },
        },
      ],
    }).success,
  ).toBe(false);
});

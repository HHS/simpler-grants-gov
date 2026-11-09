import { readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const directory = fileURLToPath(new URL("../content/forms/", import.meta.url));
type Node = { kind: string; id?: string; children?: Node[] };
const fields = (nodes: Node[]): Node[] =>
  nodes.flatMap((node) =>
    node.kind === "field" ? [node] : fields(node.children ?? []),
  );

describe("durable field link identities", () => {
  const plans = readdirSync(directory)
    .filter((name) => name.endsWith(".json"))
    .map((file) => ({
      file,
      fields: fields(
        JSON.parse(readFileSync(`${directory}/${file}`, "utf8")).children ?? [],
      ),
    }))
    .filter((plan) => plan.fields.length > 0);
  it("checks a nonempty set of authored plans", () => {
    expect(plans.length).toBeGreaterThan(0);
  });
  for (const plan of plans) {
    it(`${plan.file} gives every plan field a unique persisted slug`, () => {
      const ids = plan.fields.map((field) => field.id);
      for (const id of ids) expect(id).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
      expect(new Set(ids).size).toBe(ids.length);
    });
  }
});

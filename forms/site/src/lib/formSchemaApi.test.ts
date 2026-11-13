import { execFileSync } from "node:child_process";
import {
  cp,
  mkdir,
  mkdtemp,
  readdir,
  readFile,
  rm,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { dereferenceFormSchema } from "./dereferenceSchema";
import { CANONICAL_DIR, loadFormSpec } from "./formSpec";

const formsRoot = path.resolve("..");
const ids = (await readdir(path.join(CANONICAL_DIR, "forms"))).sort();
let fixture: string;

beforeAll(async () => {
  fixture = await mkdtemp(path.join(tmpdir(), "schema-api-"));
  const forms = path.join(fixture, "forms");
  await mkdir(path.join(fixture, "api/src/form_schema/forms"), {
    recursive: true,
  });
  await cp(path.join(formsRoot, "scripts"), path.join(forms, "scripts"), {
    recursive: true,
  });
  await cp(path.join(formsRoot, "dist"), path.join(forms, "dist"), {
    recursive: true,
  });
  // Exercise the real installer even for definitions that are not opted into API sync.
  // Only this temporary copy opts in; no production form or installation is changed.
  for (const id of ids) {
    const optionsFile = path.join(forms, "dist/sgg/forms", id, "sgg.json");
    const options = JSON.parse(await readFile(optionsFile, "utf8"));
    options.sync = { sggVersion: "1.0", xml: "mapping" };
    await writeFile(optionsFile, JSON.stringify(options));
  }
  execFileSync(process.execPath, [path.join(forms, "scripts/sync.mjs")]);
});

afterAll(async () => {
  if (fixture) await rm(fixture, { recursive: true, force: true });
});

function refs(node: unknown): string[] {
  if (!node || typeof node !== "object") return [];
  return Object.entries(node).flatMap(([key, value]) =>
    key === "$ref" && typeof value === "string" ? [value] : refs(value),
  );
}

describe.each(ids)("%s API schema artifact", (id) => {
  it("displays the exact bytes installed by sync, preserving reusable definitions", async () => {
    const spec = await loadFormSpec(id);
    const file = spec.schemas.find((entry) => entry.name === "schema.json")!;
    const installed = await readFile(
      path.join(
        fixture,
        "api/src/form_schema/forms",
        `${id.replace(/-/g, "_")}_generated`,
        "1/0/json_schema.json",
      ),
      "utf8",
    );
    expect(file.code).toBe(installed);
    const schema = JSON.parse(file.code);
    const references = refs(schema);
    for (const ref of references) {
      expect(ref).toMatch(/^#\/\$defs\//);
      expect(schema.$defs[ref.slice("#/$defs/".length)], ref).toBeDefined();
    }
    if (id === "epa-key-contacts") {
      expect(
        references.filter((ref) => ref === "#/$defs/EPAContact").length,
      ).toBe(4);
      expect(schema.$defs["person.name"]).toBeDefined();
      expect(schema.$defs.StateCode).toBeDefined();
    }
    // The expanded preview schema is deliberately a different consumer artifact.
    const expanded = await dereferenceFormSchema(
      path.join(CANONICAL_DIR, "forms", id, "schema.json"),
    );
    expect(`${JSON.stringify(expanded, null, 2)}\n`).not.toBe(installed);
  });
});

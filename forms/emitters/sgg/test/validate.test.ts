import { compile, NodeHost } from "@typespec/compiler";
import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const MAIN = fileURLToPath(new URL("../../../specs/main.tsp", import.meta.url));

/** The diagnostic codes from compiling every form with `augment` added. */
const codesWith = async (augment: string) => {
  const dir = await mkdtemp(path.join(tmpdir(), "simpler-forms-sgg-"));
  const entry = path.join(dir, "main.tsp");
  await writeFile(entry, `import "${MAIN}";\n${augment}\n`);
  const program = await compile(NodeHost, entry, { noEmit: true });
  return program.diagnostics.map((d) => d.code);
};

const INCOMPLETE = "simpler-forms-sgg/sync-xml-transform-incomplete";

describe("@Sgg.sync's XML format", () => {
  // The transform rules leave out <Profile>, which wraps the PI's name and attachments.
  it.each([
    "@@SimplerForms.Sgg.sync(Forms.RRKeyPerson.RRKeyPerson);",
    `@@SimplerForms.Sgg.sync(Forms.RRKeyPerson.RRKeyPerson, #{ xml: "transform" });`,
  ])("rejects transform rules that leave out elements: %s", async (augment) => {
    expect(await codesWith(augment)).toContain(INCOMPLETE);
  });

  it("accepts the XML mapping, which writes them", async () => {
    expect(
      await codesWith(
        `@@SimplerForms.Sgg.sync(Forms.RRKeyPerson.RRKeyPerson, #{ xml: "mapping" });`,
      ),
    ).toEqual([]);
  });

  it.each([
    "Forms.KeyContacts.KeyContacts",
    "Forms.EPAKeyContacts.EPAKeyContacts",
    "Forms.PerformanceSites.PerformanceSites",
  ])("accepts transform rules that write the whole XSD: %s", async (form) => {
    expect(await codesWith(`@@SimplerForms.Sgg.sync(${form});`)).toEqual([]);
  });
});

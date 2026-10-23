import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";

import { dereferenceFormSchema, wrapRefSiblings } from "./dereferenceSchema";
import { createAjv } from "./validation";

/** Writes `files` (path -> schema) under a fresh directory and returns the form's schema file. */
const canonical = (files: Record<string, unknown>) => {
  const root = mkdtempSync(path.join(tmpdir(), "dereference-schema-"));
  for (const [name, schema] of Object.entries(files)) {
    const file = path.join(root, name);
    mkdirSync(path.dirname(file), { recursive: true });
    writeFileSync(file, JSON.stringify(schema));
  }
  return path.join(root, "forms", "profile-form", "schema.json");
};

// Laid out as the emitter lays out its output: a relative `$id` per file, and `$ref`s
// relative to the file's location rather than to its `$id`.
const email = {
  $schema: "https://json-schema.org/draft/2020-12/schema",
  $id: "person/email/schema.json",
  type: "string",
  title: "Email",
  format: "email",
};

const profile = {
  $schema: "https://json-schema.org/draft/2020-12/schema",
  $id: "person/profile/schema.json",
  type: "object",
  title: "Profile",
  properties: {
    name: { type: "string" },
    email: { $ref: "../email/schema.json" },
  },
  required: ["name"],
};

const form = (profileUse: Record<string, unknown>) => ({
  $schema: "https://json-schema.org/draft/2020-12/schema",
  $id: "profile-form/schema.json",
  type: "object",
  properties: {
    profile: {
      $ref: "../../question-bank/person/profile/schema.json",
      ...profileUse,
    },
  },
});

const files = (profileUse: Record<string, unknown> = {}) => ({
  "question-bank/person/email/schema.json": email,
  "question-bank/person/profile/schema.json": profile,
  "forms/profile-form/schema.json": form(profileUse),
});

describe("wrapRefSiblings", () => {
  it("moves ref into allOf beside its siblings", () => {
    expect(wrapRefSiblings({ $ref: "a.json", required: ["b"] })).toEqual({
      allOf: [{ $ref: "a.json" }],
      required: ["b"],
    });
  });

  it("adds ref to an existing allOf", () => {
    const branch = { if: {}, then: {} };
    expect(wrapRefSiblings({ $ref: "a.json", allOf: [branch] })).toEqual({
      allOf: [{ $ref: "a.json" }, branch],
    });
  });

  it("leaves lone ref unchanged", () => {
    expect(wrapRefSiblings({ $ref: "a.json" })).toEqual({ $ref: "a.json" });
  });

  it("wraps refs nested in properties and arrays", () => {
    expect(
      wrapRefSiblings({
        properties: {
          list: { items: [{ $ref: "a.json", title: "A" }] },
        },
      }),
    ).toEqual({
      properties: {
        list: { items: [{ allOf: [{ $ref: "a.json" }], title: "A" }] },
      },
    });
  });
});

describe("dereferenceFormSchema", () => {
  it("inlines every ref", async () => {
    const schema = await dereferenceFormSchema(canonical(files()));
    expect(JSON.stringify(schema)).not.toContain('"$ref"');
  });

  it("resolves refs against file location, not relative $id", async () => {
    const schema = await dereferenceFormSchema(canonical(files()));
    expect(schema.properties.profile.properties.email.format).toBe("email");
  });

  it("keeps referenced required beside local required", async () => {
    const schema = await dereferenceFormSchema(
      canonical(files({ required: ["email"] })),
    );
    expect(schema.properties.profile).toMatchObject({
      allOf: [{ required: ["name"] }],
      required: ["email"],
    });
  });

  it("rejects data missing a referenced required field", async () => {
    const schema = await dereferenceFormSchema(
      canonical(files({ required: ["email"] })),
    );
    const validate = createAjv().compile(schema);
    expect(validate({ profile: { email: "pi@example.invalid" } })).toBe(false);
    expect(validate.errors).toContainEqual(
      expect.objectContaining({
        instancePath: "/profile",
        params: { missingProperty: "name" },
      }),
    );
  });

  it("keeps local title beside referenced title", async () => {
    const schema = await dereferenceFormSchema(
      canonical(files({ title: "PD/PI" })),
    );
    expect(schema.properties.profile).toMatchObject({
      allOf: [{ title: "Profile" }],
      title: "PD/PI",
    });
  });

  it("drops each file's $id", async () => {
    const schema = await dereferenceFormSchema(canonical(files()));
    expect(JSON.stringify(schema)).not.toContain('"$id"');
  });
});

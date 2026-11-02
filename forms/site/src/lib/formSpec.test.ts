import type { JsonSchema } from "@jsonforms/core";
import { processFormSchema } from "@sgg/frontend/utils/applyForm/applyFormUtils";
import { beforeAll, describe, expect, it } from "vitest";

import { unadaptableScopes } from "../vendor/sgg/jsonFormsUiSchema";
import { loadFormSpec, type FormSpec } from "./formSpec";
import { createAjv } from "./validation";

type UiNode = {
  type: string;
  scope?: string;
  label?: string;
  elements?: UiNode[];
  options?: { detail?: UiNode };
};

const resolveScope = (schema: JsonSchema, scope: string) =>
  scope
    .slice(2)
    .split("/")
    .reduce<unknown>(
      (node, key) => (node as Record<string, unknown>)?.[key],
      schema,
    ) as JsonSchema | undefined;

/** Every Control scope in the tree, paired with the schema it is relative to. */
const controls = (node: UiNode, schema: JsonSchema): [string, JsonSchema][] => {
  const own: [string, JsonSchema][] = node.scope ? [[node.scope, schema]] : [];
  const detail = node.options?.detail;
  const items =
    node.scope && (resolveScope(schema, node.scope)?.items as JsonSchema);
  return [
    ...own,
    ...(detail && items ? controls(detail, items) : []),
    ...(node.elements ?? []).flatMap((child) => controls(child, schema)),
  ];
};

const groupLabels = (node: UiNode): string[] => [
  ...(node.type === "Group" && node.label ? [node.label] : []),
  ...(node.elements ?? []).flatMap(groupLabels),
];

const clone = <T>(value: T): T => structuredClone(value);

describe.each([
  "key-contacts",
  "epa-key-contacts",
  "rr-key-person",
  "rr-key-person-expanded",
  "nsf-key-person-expanded",
])("loadFormSpec(%s)", (specId) => {
  let spec: FormSpec;
  beforeAll(async () => {
    spec = await loadFormSpec(specId);
  });

  it("inlines every $ref", () => {
    expect(JSON.stringify(spec.schema)).not.toContain('"$ref"');
  });

  it("resolves every UI scope against the rendered schema", () => {
    const { formSchema } = processFormSchema(spec.schema);
    const found = controls(
      spec.uischema as unknown as UiNode,
      formSchema as JsonSchema,
    );
    expect(found.length).toBeGreaterThan(0);
    for (const [scope, schema] of found) {
      expect(resolveScope(schema, scope), scope).toBeDefined();
    }
  });

  it("draws every control with an SGG widget", () => {
    const { formSchema } = processFormSchema(spec.schema);
    expect(unadaptableScopes(spec.uischema, formSchema)).toEqual([]);
  });

  it("has an example from the TypeSpec that passes validation", () => {
    expect(spec.example).toBeDefined();
    const validate = createAjv().compile(spec.schema);
    expect(validate(spec.example), JSON.stringify(validate.errors)).toBe(true);
  });
});

describe("validation rules", () => {
  it("requires state and zip code for a US address", async () => {
    const { schema, example } = await loadFormSpec("key-contacts");
    const data = clone(example) as {
      key_contacts: { address: Record<string, string> }[];
    };
    delete data.key_contacts[0].address.state;
    const validate = createAjv().compile(schema);
    expect(validate(data)).toBe(false);
    expect(validate.errors).toContainEqual(
      expect.objectContaining({
        instancePath: "/key_contacts/0/address",
        params: { missingProperty: "state" },
      }),
    );
  });

  it("requires a key contact's email", async () => {
    const { schema, example } = await loadFormSpec("key-contacts");
    const data = clone(example) as {
      key_contacts: Record<string, unknown>[];
    };
    delete data.key_contacts[0].email;
    expect(createAjv().compile(schema)(data)).toBe(false);
  });

  it("does not require an EPA contact's email", async () => {
    const { schema, example } = await loadFormSpec("epa-key-contacts");
    const data = clone(example) as {
      payee: Record<string, unknown>;
    };
    expect(data.payee.email).toBeUndefined();
    expect(createAjv().compile(schema)(data)).toBe(true);
  });
});

describe.each([
  "rr-key-person",
  "rr-key-person-expanded",
  "nsf-key-person-expanded",
])("%s PD/PI profile", (specId) => {
  type Data = { principal_investigator: { profile: Record<string, unknown> } };

  it("rejects a profile with only an email", async () => {
    const { schema } = await loadFormSpec(specId);
    const data = {
      principal_investigator: { profile: { email: "pi@example.invalid" } },
    };
    expect(createAjv().compile(schema)(data)).toBe(false);
  });

  it.each(["name", "address", "phone", "project_role"])(
    "requires %s alongside the email",
    async (field) => {
      const { schema, example } = await loadFormSpec(specId);
      const data = clone(example) as Data;
      delete data.principal_investigator.profile[field];
      const validate = createAjv().compile(schema);
      expect(validate(data)).toBe(false);
      expect(validate.errors).toContainEqual(
        expect.objectContaining({
          instancePath: "/principal_investigator/profile",
          params: { missingProperty: field },
        }),
      );
    },
  );

  it("requires an email", async () => {
    const { schema, example } = await loadFormSpec(specId);
    const data = clone(example) as Data;
    delete data.principal_investigator.profile.email;
    expect(createAjv().compile(schema)(data)).toBe(false);
  });
});

describe("UI layout", () => {
  it("lays out each key contacts entry with its role first and no sub-sections", async () => {
    const { uischema } = await loadFormSpec("key-contacts");
    const [contacts] = (uischema as unknown as UiNode).elements ?? [];
    expect(contacts?.label).toBe("Key Contacts");
    const list = contacts?.elements?.[1];
    expect(list?.scope).toBe("#/properties/key_contacts");
    const detail = list?.options?.detail ?? { type: "Group" };
    expect(groupLabels(detail)).toEqual([]);
    expect(detail.elements?.[0]?.scope).toBe("#/properties/project_role");
  });

  it("labels each EPA role section from its layout", async () => {
    const { uischema } = await loadFormSpec("epa-key-contacts");
    expect(groupLabels(uischema as unknown as UiNode)).toEqual(
      expect.arrayContaining([
        "Authorized Representative",
        "Payee",
        "Administrative Contact",
        "Project Manager",
      ]),
    );
  });

  it("leaves County and Province out of each EPA contact's address", async () => {
    const { uischema } = await loadFormSpec("epa-key-contacts");
    const text = JSON.stringify(uischema);
    expect(text).not.toMatch(/properties\/(county|province)"/);
  });
});

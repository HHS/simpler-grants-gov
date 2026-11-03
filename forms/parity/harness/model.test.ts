import { describe, expect, it } from "vitest";

import { fromPointer, fromScope, fromXmlPath, render } from "./model.ts";

describe("render", () => {
  it("marks array items with []", () => {
    expect(render(["key_contacts", "[]", "name", "first_name"])).toBe(
      "key_contacts[].name.first_name",
    );
  });
});

describe("fromPointer", () => {
  it("reads index.json paths", () => {
    expect(fromPointer("/key_contacts/[]/address/city")).toBe(
      "key_contacts[].address.city",
    );
  });
});

describe("fromScope", () => {
  it("reads JSON Forms scopes", () => {
    expect(fromScope("#/properties/name/properties/prefix")).toEqual([
      "name",
      "prefix",
    ]);
  });

  it("rejects scopes outside properties", () => {
    expect(() => fromScope("#/items/0")).toThrow();
  });
});

describe("fromXmlPath", () => {
  it("drops namespace prefixes", () => {
    expect(
      fromXmlPath("Key_Contacts_2_0:RoleOnProject/globLib:FirstName"),
    ).toBe("RoleOnProject/FirstName");
  });
});

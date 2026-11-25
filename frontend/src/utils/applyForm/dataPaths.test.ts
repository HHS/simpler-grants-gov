import {
  dataPathToDefinition,
  dataPathToHtmlName,
  dataPathToWarningPath,
  fieldDataPath,
  hasListIndex,
  relativeSegments,
} from "src/utils/applyForm/dataPaths";

describe("dataPathToDefinition", () => {
  it.each([
    ["title", "/properties/title"],
    ["address.city", "/properties/address/properties/city"],
    ["people.0.bio", "/properties/people/items/properties/bio"],
    ["", ""],
  ])("converts %s to its JSON schema definition", (path, definition) => {
    expect(dataPathToDefinition(path)).toEqual(definition);
  });
});

describe("dataPathToHtmlName", () => {
  it.each([
    ["title", "title"],
    ["address.city", "address--city"],
    ["people.0.bio", "people[0]--bio"],
    ["a.0.b.1.c", "a[0]--b[1]--c"],
  ])(
    "converts %s to the HTML field name the save action reads",
    (path, name) => {
      expect(dataPathToHtmlName(path)).toEqual(name);
    },
  );
});

describe("dataPathToWarningPath", () => {
  it.each([
    ["title", "$.title"],
    ["people.0.phones.1.number", "$.people[0].phones[1].number"],
  ])("converts %s to the API's validation warning path", (path, warning) => {
    expect(dataPathToWarningPath(path)).toEqual(warning);
  });
});

describe("hasListIndex", () => {
  it.each([
    ["people.0.name", true],
    ["address.city", false],
    [undefined, false],
  ])("returns whether %s is inside a list entry", (path, expected) => {
    expect(hasListIndex(path as string)).toBe(expected);
  });
});

describe("fieldDataPath", () => {
  it("adds the properties between a control's definition and its field's", () => {
    expect(
      fieldDataPath(
        "people.0.name",
        "/properties/people/items/properties/name/properties/first",
      ),
    ).toEqual("people.0.name.first");
  });

  it("returns the control's path for a field the control renders itself", () => {
    expect(
      fieldDataPath(
        "people.0.name",
        "/properties/people/items/properties/name",
      ),
    ).toEqual("people.0.name");
  });
});

describe("relativeSegments", () => {
  it("returns the segments of a path beneath a base path", () => {
    expect(relativeSegments("people.0.name.first", "people.0")).toEqual([
      "name",
      "first",
    ]);
  });
});

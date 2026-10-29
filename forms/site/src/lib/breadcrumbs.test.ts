import { describe, expect, it } from "vitest";

import {
  currentTrail,
  headingTag,
  outlineTree,
  type CrumbAnchor,
  type OutlineNode,
} from "./breadcrumbs";

const anchor = (id: string, level: number, top: number): CrumbAnchor => ({
  id,
  label: id,
  level,
  top,
});

describe("currentTrail", () => {
  const ANCHORS = [
    anchor("contacts", 1, -900),
    anchor("contact-1", 2, -800),
    anchor("contact-1-name", 3, -700),
    anchor("contact-1-address", 3, -200),
    anchor("contact-2", 2, 30),
    anchor("contact-2-name", 3, 400),
  ];
  const ids = (offset: number) =>
    currentTrail(ANCHORS, offset).map((c) => c.id);

  it("names nothing before the first heading reaches the bar", () => {
    expect(currentTrail([anchor("contacts", 1, 120)], 56)).toEqual([]);
  });

  it("names the latest heading at each level that has passed the bar", () => {
    expect(ids(0)).toEqual(["contacts", "contact-1", "contact-1-address"]);
  });

  it("drops a deeper heading once a shallower one passes after it", () => {
    expect(ids(56)).toEqual(["contacts", "contact-2"]);
  });
});

describe("headingTag", () => {
  it.each([
    [1, "h3"],
    [2, "h4"],
    [3, "h5"],
    [4, "h6"],
    [6, "h6"],
  ])("puts level %i in an %s", (level, tag) => {
    expect(headingTag(level)).toBe(tag);
  });
});

describe("outlineTree", () => {
  const crumb = (id: string, level: number) => ({ id, label: id, level });
  const shape = (nodes: OutlineNode[]): unknown[] =>
    nodes.map((n) =>
      n.children.length ? { [n.id]: shape(n.children) } : n.id,
    );

  it("nests each section under the last shallower one before it", () => {
    expect(
      shape(
        outlineTree([
          crumb("rep", 1),
          crumb("rep-name", 2),
          crumb("rep-address", 2),
          crumb("payee", 1),
          crumb("payee-name", 2),
        ]),
      ),
    ).toEqual([
      { rep: ["rep-name", "rep-address"] },
      { payee: ["payee-name"] },
    ]);
  });

  it("keeps a section whose parent level is skipped under the nearest one", () => {
    expect(
      shape(outlineTree([crumb("contacts", 1), crumb("name", 3)])),
    ).toEqual([{ contacts: ["name"] }]);
  });
});

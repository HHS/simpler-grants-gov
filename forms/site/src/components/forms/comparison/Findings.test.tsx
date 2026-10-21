import type { Finding } from "@parity/index.ts";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import DifferenceCard from "./DifferenceCard";
import FindingCard from "./FindingCard";
import Findings from "./Findings";

const raw: Finding = {
  id: "jsonSchemaVsXsd:0",
  check: "jsonSchemaVsXsd",
  checkTitle: "JSON Schema vs XSD",
  status: "unrecorded",
  dimension: "maxOccurs",
  kind: "maxOccurs differs",
  path: "contacts[]",
  detail: "The occurrence bound differs; retain the original detail.",
  values: { plan: null, source: 0 },
  anchors: [
    { artifact: "jsonSchema", path: "contacts[]" },
    { artifact: "xsd", path: "Contacts/Contact" },
  ],
  recordAs: { register: "differingRules", key: "contacts[]/maxOccurs" },
};
const render = (finding: Finding) =>
  renderToStaticMarkup(createElement(FindingCard, { finding }));
describe("original finding cards", () => {
  it("shares the card while preserving artifact names, raw values and record coordinate", () => {
    const html = render(raw);
    expect(html).toContain('class="difference-card"');
    for (const text of [
      "JSON Schema vs XSD",
      "maxOccurs differs",
      "Contacts/Contact",
      "contacts[]",
      "null",
      ">0<",
      "differingRules",
      "contacts[]/maxOccurs",
      raw.detail!,
    ])
      expect(html).toContain(text);
    expect(html).not.toContain("None stated");
    expect(html).not.toContain("<dt>Plan</dt>");
  });
  it("distinguishes absent values from null, empty strings and arrays", () => {
    expect(render({ ...raw, values: undefined })).not.toContain(
      'class="value-pair"',
    );
    const html = render({ ...raw, values: { plan: "", source: [] } });
    expect(html).toContain("&quot;&quot;");
    expect(html).toContain("[]");
  });
  it("retains stale record category/reason and malformed suite evidence without field anchors", () => {
    const stale: Finding = {
      ...raw,
      id: "stale:0",
      status: "stale",
      kind: "stale entry",
      dimension: "record",
      values: undefined,
      anchors: [
        { artifact: "differenceRecord", path: "dat.differingRules/old" },
      ],
      entry: {
        category: "upstream",
        reason: "Original accepted source defect.",
      },
    };
    const suite: Finding = {
      ...raw,
      id: "index:0",
      check: "index",
      checkTitle: "Schema index",
      status: "unrecorded",
      kind: "malformed artifact",
      dimension: "index",
      anchors: [],
      detail: "Malformed schema cannot be compared.",
      values: undefined,
    };
    const html = renderToStaticMarkup(
      createElement(Findings, { findings: [raw, stale, suite] }),
    );
    for (const text of [
      "Stale record",
      "Recorded category: Upstream",
      "Original accepted source defect.",
      "Difference record",
      "dat.differingRules/old",
      "malformed artifact",
      suite.detail!,
      "Showing 3 of 3 check findings",
      "Unrecorded differences",
    ])
      expect(html).toContain(text);
    expect((html.match(/class="difference-card"/g) ?? []).length).toBe(3);
  });
  it("shows directional missing/extra chips and truthful empty state", () => {
    const missing = {
      ...raw,
      kind: "missing from plan",
      dimension: "presence",
      values: undefined,
    };
    const extra = {
      ...raw,
      id: "extra:0",
      kind: "missing from source",
      dimension: "presence",
      values: undefined,
    };
    const html = renderToStaticMarkup(
      createElement(Findings, { findings: [missing, extra] }),
    );
    for (const text of [
      "Missing elements",
      "Extra elements",
      "missing from plan",
    ])
      expect(html).toContain(text);
    expect(
      renderToStaticMarkup(createElement(Findings, { findings: [] })),
    ).toContain("No parity findings were reported by these checks.");
  });
  it("preserves existing field-sheet evidence and null fallback", () => {
    const cell = {
      status: "intentional" as const,
      value: "DAT wording",
      reason: "Accepted wording",
    };
    const html = renderToStaticMarkup(
      createElement(DifferenceCard, {
        difference: {
          attribute: "help",
          source: "dat",
          row: {
            attribute: "help",
            plan: null,
            cells: { dat: cell, xsd: cell, form: cell },
          },
          cell,
        },
      }),
    );
    for (const text of [
      "Help vs DAT",
      "Intentional",
      "None stated",
      "DAT wording",
      "Accepted wording",
    ])
      expect(html).toContain(text);
    expect((html.match(/class="difference-card"/g) ?? []).length).toBe(1);
  });
});

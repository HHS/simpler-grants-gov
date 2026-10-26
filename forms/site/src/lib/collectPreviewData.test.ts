import type { RJSFSchema } from "@rjsf/utils";
import { describe, expect, it } from "vitest";

import { collectPreviewData } from "./collectPreviewData";

const schema: RJSFSchema = {
  type: "object",
  properties: {
    representative: {
      type: "object",
      properties: {
        signature: { type: "string", readOnly: true },
        title: { type: "string" },
      },
    },
    submitted_date: { type: "string", format: "date", readOnly: true },
    project: { type: "string" },
    citations: {
      type: "array",
      items: { type: "object", properties: { citation: { type: "string" } } },
    },
  },
};
const context = {
  representative: { signature: "Illustrative official", title: "Old title" },
  submitted_date: "2026-10-24",
  project: "Old project",
  unrecognized: "Must not be copied",
};

describe("native preview collection with explicit read-only context", () => {
  it("retains nested/scalar context while collecting an applicant edit", () => {
    const data = new FormData();
    data.set("representative--title", "New title");
    data.set("project", "New project");
    expect(collectPreviewData(data, schema, context)).toEqual({
      representative: {
        signature: context.representative.signature,
        title: "New title",
      },
      submitted_date: context.submitted_date,
      project: "New project",
    });
  });

  it("does not restore cleared editable fields or unknown previous keys", () => {
    const result = collectPreviewData(new FormData(), schema, context);
    expect(result).not.toHaveProperty("project");
    expect(result).not.toHaveProperty("representative.title");
    expect(result).not.toHaveProperty("unrecognized");
    expect(result).toHaveProperty(
      "representative.signature",
      context.representative.signature,
    );
  });

  it("does not invent context or accept a forged immutable value", () => {
    const data = new FormData();
    data.set("submitted_date", "2099-01-01");
    expect(collectPreviewData(data, schema, {})).not.toHaveProperty(
      "submitted_date",
    );
    expect(collectPreviewData(data, schema, context)).toHaveProperty(
      "submitted_date",
      context.submitted_date,
    );
  });

  it("keeps edited array rows authoritative rather than resurrecting an old row", () => {
    const data = new FormData();
    data.set("citations[0]--citation", "Remaining study");
    const result = collectPreviewData(data, schema, {
      citations: [
        { citation: "Deleted study" },
        { citation: "Remaining study" },
      ],
    });
    expect(result).toHaveProperty("citations", [
      { citation: "Remaining study" },
    ]);
  });

  it("does not pretend to reconcile readonly members inside editable array rows", () => {
    const rows: RJSFSchema = {
      type: "object",
      properties: {
        people: {
          type: "array",
          items: {
            type: "object",
            properties: {
              identity: { type: "string", readOnly: true },
              answer: { type: "string" },
            },
          },
        },
      },
    };
    const data = new FormData();
    data.set("people[0]--answer", "Remaining answer");
    expect(
      collectPreviewData(data, rows, {
        people: [{ identity: "Deleted" }, { identity: "Remaining" }],
      }),
    ).toEqual({ people: [{ answer: "Remaining answer" }] });
  });

  it("keeps callback-owned deleted and blank draft rows authoritative during sibling edits", () => {
    const data = new FormData();
    data.set("project", "Current project");
    data.set("citations[0]--citation", "Stale deleted row");
    data.set("citations[1]--citation", "Remaining row");
    const draft = {
      citations: [{ citation: "Remaining row" }, {}],
      project: "Old project",
    };
    const result = collectPreviewData(
      data,
      schema,
      draft,
      new Set(["citations"]),
    );
    expect(result).toHaveProperty("citations", draft.citations);
    expect(result).toHaveProperty("project", "Current project");
  });

  it("preserves each callback list independently, including empty arrays and falsy values", () => {
    const data = new FormData();
    data.set("citations[0]--citation", "Current native row");
    const draft = {
      citations: [{ citation: "Previous row" }],
      first: [{ value: 0, flag: false }],
      second: [],
    };
    const result = collectPreviewData(
      data,
      schema,
      draft,
      new Set(["first", "second"]),
    );
    expect(result).toHaveProperty("first", draft.first);
    expect(result).toHaveProperty("second", []);
    expect(result).toHaveProperty("citations", [
      { citation: "Current native row" },
    ]);
  });

  it("does not retain an old list after its callback ownership is reset", () => {
    expect(
      collectPreviewData(new FormData(), schema, {}, new Set()),
    ).not.toHaveProperty("citations");
  });

  it("does not claim object or array ownership from ancestor annotations", () => {
    const aggregate: RJSFSchema = {
      type: "object",
      properties: {
        name: {
          type: "object",
          readOnly: true,
          properties: { first_name: { type: "string" } },
        },
        files: { type: "array", readOnly: true, items: { type: "string" } },
      },
    };
    expect(
      collectPreviewData(new FormData(), aggregate, {
        name: { first_name: "Jordan" },
        files: ["old"],
      }),
    ).toEqual({});
  });

  it("leaves conditional ownership/presence evaluation to its actual consumer", () => {
    const conditional: RJSFSchema = {
      type: "object",
      properties: { answer: { type: "string" } },
      allOf: [
        {
          if: { properties: { locked: { const: true } } },
          then: { properties: { answer: { readOnly: true } } },
        },
      ],
    };
    const data = new FormData();
    data.set("answer", "Current editable answer");
    expect(
      collectPreviewData(data, conditional, {
        locked: true,
        answer: "Previous answer",
      }),
    ).toEqual({ answer: "Current editable answer" });
  });
});

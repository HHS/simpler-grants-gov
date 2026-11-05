import { describe, expect, it } from "vitest";

import { codeBlocks } from "./codeFolding";
import { loadFormSpec } from "./formSpec";
import { highlight } from "./highlight";

describe("structural code blocks", () => {
  it("matches nested and same-line arrays and objects", () => {
    const code = '{"items": [{"name": "Ada"}]}';
    const pairs = codeBlocks(code);
    expect(pairs.size).toBe(3);
    expect(pairs.get(0)).toBe(code.length - 1);
    expect(pairs.get(code.indexOf("["))).toBe(code.indexOf("]"));
  });

  it("does not fold brackets in escaped JSON strings", () => {
    const code = String.raw`{"description":"a [bracket] and \"{quote}\"", "empty": {}}`;
    expect(codeBlocks(code).size).toBe(2);
  });

  it("ignores TypeSpec comments, quoted identifiers and multiline strings", () => {
    const code =
      '/* { */ model Example {\n // [ not a block\n `name{}`: string;\n @doc("""\n { [ example ] }\n """)\n values: string[];\n}';
    const pairs = codeBlocks(code);
    expect(pairs.size).toBe(2);
    expect(pairs.get(code.indexOf("{\n"))).toBe(code.length - 1);
  });

  it("does not invent a closing position for an incomplete block", () => {
    expect(codeBlocks('{ "pending": [')).toEqual(new Map());
  });
});

describe("highlighted files", () => {
  it("adds keyboard-operable folding controls with independent nested bodies", async () => {
    const html = await highlight(
      '{\n  "people": [{"name": "Ada"}]\n}',
      "json",
      "file-a",
    );
    expect(html.match(/data-code-fold/g)).toHaveLength(3);
    expect(html).toContain('type="button"');
    expect(html).toContain('aria-expanded="true"');
    expect(html).toContain('aria-label="Collapse block at line 1"');
    expect(html).toContain('aria-controls="file-a-block-0"');
    expect(html).toContain('id="file-a-block-0"');
    expect(html.match(/class="code-fold__placeholder" hidden/g)).toHaveLength(
      3,
    );
    expect(html).toContain("Ada");
  });

  it("highlights TypeSpec while preserving source and ignoring doc-string braces", async () => {
    const html = await highlight(
      '@doc("{}")\nmodel Person {\n name: string;\n}',
      "typespec",
      "source-a",
    );
    expect(html).toMatch(/<span[^>]+>model<\/span>/);
    expect(html.match(/data-code-fold/g)).toHaveLength(1);
    expect(html).toContain("Person");
    expect(html).toContain('aria-label="Collapse block at line 2"');
  });

  it("escapes untrusted code rather than turning it into markup", async () => {
    const html = await highlight(
      '{"description":"<script>alert(1)</script>"}',
      "json",
      "safe",
    );
    expect(html).not.toContain("<script>");
    expect(html).toContain("&#x3C;script");
  });

  it("leaves existing live JSON/XML code unfolded", async () => {
    expect(await highlight('{"value": 1}', "json")).not.toContain(
      "data-code-fold",
    );
    expect(await highlight('<Value name="test">1</Value>', "xml")).toMatch(
      /<span[^>]+>Value<\/span>/,
    );
  });

  it.each([
    "key-contacts",
    "epa-key-contacts",
    "performance-sites",
    "rr-key-person-expanded",
  ])(
    "preserves every character in %s artifacts and source while adding controls",
    async (id) => {
      const spec = await loadFormSpec(id);
      for (const file of [...spec.schemas, ...spec.sources]) {
        const html = await highlight(file.code, file.lang, "complete");
        const restored = html
          .replace(/<button\b[^>]*>[\s\S]*?<\/button>/g, "")
          .replace(
            /<span class="code-fold__placeholder"[^>]*>[\s\S]*?<\/span>/g,
            "",
          )
          .replace(/<[^>]+>/g, "")
          .replace(/&#x([\da-f]+);/gi, (_, value: string) =>
            String.fromCodePoint(parseInt(value, 16)),
          )
          .replace(/&#(\d+);/g, (_, value: string) =>
            String.fromCodePoint(Number(value)),
          )
          .replace(/&lt;/g, "<")
          .replace(/&gt;/g, ">")
          .replace(/&quot;/g, '"')
          .replace(/&amp;/g, "&");
        expect(restored, `${id}/${file.name}`).toBe(file.code);
      }
    },
  );
});

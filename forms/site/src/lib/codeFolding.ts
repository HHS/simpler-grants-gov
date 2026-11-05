import type { Element, ElementContent, Properties } from "hast";
import type { ShikiTransformer } from "shiki";

/** Structural blocks only: braces in strings, quoted identifiers and comments are text. */
export function codeBlocks(code: string): Map<number, number> {
  const blocks = new Map<number, number>();
  const stack: { char: string; offset: number }[] = [];
  let quote = "";
  let comment = "";
  for (let i = 0; i < code.length; i++) {
    const char = code[i];
    const pair = code.slice(i, i + 2);
    if (comment === "//") {
      if (char === "\n") comment = "";
    } else if (comment === "/*") {
      if (pair === "*/") {
        comment = "";
        i++;
      }
    } else if (quote) {
      if (char === "\\") i++;
      else if (code.startsWith(quote, i)) {
        i += quote.length - 1;
        quote = "";
      }
    } else if (pair === "//" || pair === "/*") {
      comment = pair;
      i++;
    } else if (code.startsWith('"""', i)) {
      quote = '"""';
      i += 2;
    } else if (char === '"' || char === "'" || char === "`") {
      quote = char;
    } else if (char === "{" || char === "[") {
      stack.push({ char, offset: i });
    } else if (char === "}" || char === "]") {
      const open = stack.pop();
      if (
        open &&
        ((open.char === "{" && char === "}") ||
          (open.char === "[" && char === "]"))
      ) {
        blocks.set(open.offset, i);
      }
    }
  }
  return blocks;
}

const element = (
  tagName: string,
  properties: Properties,
  children: ElementContent[],
): Element => ({ type: "element", tagName, properties, children });
const text = (value: string): ElementContent => ({ type: "text", value });

/** Keep Shiki's token styles, adding a native button and hideable body to each block. */
export function foldingTransformer(idPrefix: string): ShikiTransformer {
  return {
    name: "form-code-folding",
    code(node) {
      const chunks: { value: string; properties: Properties }[] = [];
      const collect = (child: ElementContent, properties: Properties = {}) => {
        if (child.type === "text")
          chunks.push({ value: child.value, properties });
        else if (child.type === "element") {
          // Line wrappers aren't needed once a block can span several lines.
          const next = child.properties.style
            ? { ...properties, style: child.properties.style }
            : properties;
          child.children.forEach((entry) => collect(entry, next));
        }
      };
      node.children.forEach((child) => collect(child));
      const source = chunks.map((chunk) => chunk.value).join("");
      const blocks = codeBlocks(source);
      const ends = new Set(blocks.values());
      const boundaries = [...blocks.keys(), ...ends].sort((a, b) => a - b);
      const output: ElementContent[] = [];
      const parents = [output];
      let chunkIndex = 0;
      let chunkOffset = 0;
      let position = 0;
      const take = (end: number, into: ElementContent[]) => {
        while (position < end) {
          const chunk = chunks[chunkIndex];
          const count = Math.min(
            end - position,
            chunk.value.length - chunkOffset,
          );
          const content = text(
            chunk.value.slice(chunkOffset, chunkOffset + count),
          );
          into.push(
            Object.keys(chunk.properties).length
              ? element("span", chunk.properties, [content])
              : content,
          );
          position += count;
          chunkOffset += count;
          if (chunkOffset === chunk.value.length) {
            chunkIndex++;
            chunkOffset = 0;
          }
        }
      };
      for (const boundary of boundaries) {
        take(boundary, parents[parents.length - 1]);
        if (blocks.has(boundary)) {
          const line = source.slice(0, boundary).split("\n").length;
          const bodyId = `${idPrefix}-block-${boundary}`;
          const inner: ElementContent[] = [];
          const opening: ElementContent[] = [];
          take(boundary + 1, opening);
          parents[parents.length - 1].push(
            element("span", { className: ["code-fold"] }, [
              element(
                "button",
                {
                  type: "button",
                  className: ["code-fold__toggle"],
                  "data-code-fold": true,
                  "data-code-line": line,
                  "aria-expanded": "true",
                  "aria-controls": bodyId,
                  "aria-label": `Collapse block at line ${line}`,
                },
                [text("−")],
              ),
              ...opening,
              element(
                "span",
                { className: ["code-fold__placeholder"], hidden: true },
                [text(" … ")],
              ),
              element(
                "span",
                { id: bodyId, className: ["code-fold__body"] },
                inner,
              ),
            ]),
          );
          parents.push(inner);
        } else {
          parents.pop();
          // The closing delimiter stays visible when this block is collapsed.
          const parent = parents[parents.length - 1];
          const block = parent[parent.length - 1] as Element;
          take(boundary + 1, block.children);
        }
      }
      take(source.length, output);
      node.children = output;
    },
  };
}

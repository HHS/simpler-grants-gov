/**
 * Generate a form's XML from a mapping shaped like the XML (`xml-mapping.json`).
 *
 * In two steps, as the CommonGrants SDK's `transformFromMapping` does the first:
 *
 *   1. `transformFromMapping` resolves the mapping against the response, with one handler
 *      per `$` word (`handlers.ts`), into a tree shaped like the document.
 *   2. `writeXml` writes that tree as XML (`writeXml.ts`).
 *
 * The API's `xml_generation.mapping` package does the same, so both write the same XML.
 */
import type { XmlMapping } from "./format.js";
import { defaultHandlers, type AttachmentInfo } from "./handlers.js";
import { Group, transformFromMapping } from "./transform.js";
import { writeXml } from "./writeXml.js";

export interface GenerateOptions {
  /** The upload an attachment id names. Required for a mapping with attachments. */
  attachment?: (id: string) => AttachmentInfo | undefined;
}

/**
 * The XML `mapping` builds from `data`, a form's response, formatted as the API writes it.
 * An element with nothing to write, and a group none of whose elements has one, is left out.
 */
export function generateXml(
  mapping: XmlMapping,
  data: unknown,
  options: GenerateOptions = {},
): string {
  const resolved = transformFromMapping(
    data,
    mapping.root,
    defaultHandlers(options.attachment),
  );
  const root =
    resolved instanceof Group && resolved.size
      ? resolved
      : new Group([[Object.keys(mapping.root)[0], new Group()]]);
  return writeXml(root, mapping.namespaces);
}

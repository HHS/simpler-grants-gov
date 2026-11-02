import type { XmlTransformFields } from "./flatten/xmlTransform.ts";
import { xmlMappingFields } from "./flatten/xmlMapping.ts";
import { xmlTransformFields } from "./flatten/xmlTransform.ts";
import { loadXmlMapping, loadXmlTransform } from "./load.ts";

/** The two formats `form-library-xml` writes a form's mapping to the XSD in. */
export type XmlFormat = "xml-transform" | "xml-mapping";

/**
 * The fields a form's emitted XML mapping maps, read from the file in `format`, or undefined
 * for a form not mapped. Both formats flatten to the same fields, so every comparison reads
 * either.
 */
export function xmlFields(
  specId: string,
  format: XmlFormat = "xml-transform",
): XmlTransformFields | undefined {
  if (format === "xml-mapping") {
    const mapping = loadXmlMapping(specId);
    return mapping && xmlMappingFields(mapping);
  }
  const rules = loadXmlTransform(specId);
  return rules && xmlTransformFields(rules);
}

/**
 * Write a resolved mapping (`transformFromMapping`'s tree) as Grants.gov XML.
 *
 * A key without a prefix is in the form's namespace, `prefix:Name` is in another, and
 * `@prefix:Name` is an attribute. A `Group` is an element's children, an array repeats its
 * element once per entry, an `AttachedFile` is an `att:AttachedFileDataType`, an
 * `EmptyElement` is an element with no content, and anything else is the element's text. The
 * output matches the API's: the same namespace declarations, serialization and attachment
 * elements.
 */
import { AttachedFile, EmptyElement, type AttachmentInfo } from "./handlers.js";
import { Group } from "./transform.js";

const ATTACHMENTS = "http://apply.grants.gov/system/Attachments-V1.0";
const GLOBAL = "http://apply.grants.gov/system/Global-V1.0";

interface Node {
  name: string;
  attributes: [string, string][];
  children: Node[];
  text?: string;
}

// ---------------------------------------------------------------------------
// Public functions
// ---------------------------------------------------------------------------

/**
 * `root`, one key naming the root element, as an XML document. `namespaces` maps each
 * prefix to its namespace, with `default` as the form's own.
 */
export function writeXml(
  root: Group,
  namespaces: Record<string, string>,
): string {
  const { default: defaultNs, ...declared } = namespaces;
  const prefixOf = (uri: string) =>
    Object.entries(declared).find(([, value]) => value === uri)?.[0];
  const formPrefix = prefixOf(defaultNs);
  if (!formPrefix)
    throw new Error(`no prefix declares the default namespace ${defaultNs}`);
  const qualify = (key: string) =>
    key.includes(":") ? key : `${formPrefix}:${key}`;

  const attachmentNodes = (info: AttachmentInfo): Node[] => {
    const att = prefixOf(ATTACHMENTS) ?? "att";
    // A namespace the document doesn't declare is declared on the element, under the
    // `ns0` lxml gives it, so the output matches the API's.
    const glob = prefixOf(GLOBAL);
    const hash = glob ?? "ns0";
    return [
      leaf(`${att}:FileName`, info.fileName),
      leaf(`${att}:MimeType`, info.mimeType),
      {
        name: `${att}:FileLocation`,
        attributes: [[`${att}:href`, info.fileLocation]],
        children: [],
      },
      {
        name: `${hash}:HashValue`,
        attributes: [
          ...(glob ? [] : [["xmlns:ns0", GLOBAL] as [string, string]]),
          [`${hash}:hashAlgorithm`, info.hashAlgorithm ?? "SHA-1"],
        ],
        children: [],
        text: info.hashValue,
      },
    ];
  };

  const element = (key: string, value: unknown): Node => {
    const node: Node = { name: qualify(key), attributes: [], children: [] };
    if (value instanceof Group) writeChildren(node, value);
    else if (value instanceof AttachedFile)
      node.children = attachmentNodes(value.info);
    else if (!(value instanceof EmptyElement)) node.text = text(value);
    return node;
  };

  const writeChildren = (node: Node, content: Group) => {
    for (const [key, value] of content) {
      if (key.startsWith("@"))
        node.attributes.push([
          key.slice(1),
          value instanceof EmptyElement ? "" : text(value),
        ]);
      else
        for (const entry of Array.isArray(value) ? value : [value])
          node.children.push(element(key, entry));
    }
  };

  const [[rootKey, content]] = [...root];
  const document: Node = {
    name: qualify(rootKey),
    attributes: Object.entries(declared).map(([prefix, uri]) => [
      `xmlns:${prefix}`,
      uri,
    ]),
    children: [],
  };
  if (content instanceof Group) writeChildren(document, content);
  return `<?xml version='1.0' encoding='utf-8'?>\n${render(document, "")}`;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const leaf = (name: string, text: string): Node => ({
  name,
  attributes: [],
  children: [],
  text,
});

function text(value: unknown): string {
  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  )
    return String(value);
  throw new Error(`expected a value, got ${JSON.stringify(value)}`);
}

const escape = (text: string) =>
  text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const escapeAttribute = (text: string) => escape(text).replace(/"/g, "&quot;");

function render(node: Node, indent: string): string {
  const attributes = node.attributes
    .map(([name, value]) => ` ${name}="${escapeAttribute(value)}"`)
    .join("");
  const open = `${indent}<${node.name}${attributes}`;
  if (node.children.length) {
    const inner = node.children
      .map((child) => render(child, `${indent}  `))
      .join("\n");
    return `${open}>\n${inner}\n${indent}</${node.name}>`;
  }
  if (node.text !== undefined)
    return `${open}>${escape(node.text)}</${node.name}>`;
  return `${open}/>`;
}

// What a reader of `xml-mapping.json` needs at run time, with no TypeSpec dependency, so
// the site can build a form's XML in the browser.
export * from "./format.js";
export { generateXml, type GenerateOptions } from "./generate.js";
export type { AttachmentInfo } from "./handlers.js";

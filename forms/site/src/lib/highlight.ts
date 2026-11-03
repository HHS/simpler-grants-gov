/**
 * Syntax highlighting for the Data tab's JSON and XML, in the browser: the data changes as
 * the preview is filled in, so it can't be highlighted at build time. Only the two grammars
 * and one theme are loaded, with the JavaScript regex engine instead of the WASM one.
 */
import { createHighlighterCore, type HighlighterCore } from "shiki/core";
import { createJavaScriptRegexEngine } from "shiki/engine/javascript";

export type Language = "json" | "xml";

let highlighter: Promise<HighlighterCore> | undefined;

const load = () =>
  (highlighter ??= createHighlighterCore({
    themes: [import("shiki/themes/github-light.mjs")],
    langs: [import("shiki/langs/json.mjs"), import("shiki/langs/xml.mjs")],
    engine: createJavaScriptRegexEngine(),
  }));

/**
 * `code` as highlighted HTML: a `<pre>` holding one `<span>` per token. The `<pre>` keeps
 * the site's code style rather than the theme's colors.
 */
export async function highlight(code: string, lang: Language): Promise<string> {
  return (await load()).codeToHtml(code, {
    lang,
    theme: "github-light",
    transformers: [
      {
        pre(node) {
          delete node.properties.style;
        },
      },
    ],
  });
}

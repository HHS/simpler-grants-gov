import { useEffect, useState } from "react";

import { highlight, type Language } from "../../../lib/highlight";

/** `code`, highlighted once the highlighter loads, and plain until then. */
export default function HighlightedCode({
  code,
  lang,
}: {
  code: string;
  lang: Language;
}) {
  const [html, setHtml] = useState<string>();

  useEffect(() => {
    let current = true;
    highlight(code, lang).then((result) => {
      if (current) setHtml(result);
    });
    return () => {
      current = false;
    };
  }, [code, lang]);

  return html ? (
    // shiki escapes the code it's given; the markup is its own.
    <div
      className="form-preview__code"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  ) : (
    <div className="form-preview__code">
      <pre>{code}</pre>
    </div>
  );
}

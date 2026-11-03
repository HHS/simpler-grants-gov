import { useEffect, useId, useState, type MouseEvent } from "react";

import { highlight, type Language } from "../../../lib/highlight";

/** `code`, highlighted once the highlighter loads, and plain until then. */
export default function HighlightedCode({
  code,
  lang,
  foldable = false,
}: {
  code: string;
  lang: Language;
  foldable?: boolean;
}) {
  const id = useId();
  const [result, setResult] = useState<{
    code: string;
    lang: Language;
    html: string;
  }>();

  useEffect(() => {
    let current = true;
    highlight(code, lang, foldable ? id : undefined).then((html) => {
      if (current) setResult({ code, lang, html });
    });
    return () => {
      current = false;
    };
  }, [code, lang, foldable, id]);

  const toggleBlock = (event: MouseEvent<HTMLDivElement>) => {
    const button = (event.target as HTMLElement).closest<HTMLButtonElement>(
      "button[data-code-fold]",
    );
    if (!button) return;
    const block = button.parentElement!;
    const body = block.querySelector<HTMLElement>(":scope > .code-fold__body")!;
    const placeholder = block.querySelector<HTMLElement>(
      ":scope > .code-fold__placeholder",
    )!;
    const expanded = button.getAttribute("aria-expanded") !== "true";
    button.setAttribute("aria-expanded", String(expanded));
    button.setAttribute(
      "aria-label",
      `${expanded ? "Collapse" : "Expand"} block at line ${button.dataset.codeLine}`,
    );
    button.textContent = expanded ? "−" : "+";
    body.hidden = !expanded;
    placeholder.hidden = expanded;
  };

  const html =
    result?.code === code && result?.lang === lang ? result.html : undefined;

  return html ? (
    // shiki escapes the code it's given; the markup is its own.
    <div
      className="form-preview__code"
      onClick={toggleBlock}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  ) : (
    <div className="form-preview__code">
      <pre>{code}</pre>
    </div>
  );
}

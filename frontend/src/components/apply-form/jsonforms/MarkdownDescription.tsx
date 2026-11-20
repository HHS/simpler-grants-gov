import Markdown, { type MarkdownToJSX } from "markdown-to-jsx/react";

import { JSX, ReactNode } from "react";

// Open links in a new tab, so following one doesn't leave the form mid-application.
const ExternalLink = (props: JSX.IntrinsicElements["a"]) => (
  <a
    {...props}
    className="usa-link usa-link--external"
    target="_blank"
    rel="noopener noreferrer"
  />
);

// Render markdown headings as bold paragraphs. The description appears under the
// section's heading, so a heading here would break the page's heading order.
const BoldParagraph = ({ children }: { children?: ReactNode }) => (
  <p>
    <strong>{children}</strong>
  </p>
);

const OPTIONS: MarkdownToJSX.Options = {
  forceBlock: true,
  // Raw HTML in a description is shown as text, not rendered.
  disableParsingRawHTML: true,
  overrides: {
    h1: { component: BoldParagraph },
    h2: { component: BoldParagraph },
    h3: { component: BoldParagraph },
    h4: { component: BoldParagraph },
    h5: { component: BoldParagraph },
    h6: { component: BoldParagraph },
    a: { component: ExternalLink },
  },
};

/** Renders a section description written in markdown. */
export const MarkdownDescription = ({
  text,
}: {
  text: string;
}): JSX.Element => <Markdown options={OPTIONS}>{text}</Markdown>;

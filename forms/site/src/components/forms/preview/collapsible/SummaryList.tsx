import {
  isStarted,
  previewText,
  summaryRows,
  type SummaryItem,
  type SummarySection,
} from "@/lib/collapsible";

/**
 * A collapsed entry's answers, label beside value like the form metadata card, under the
 * headings of the groups they belong to.
 */
export default function SummaryList({
  sections,
}: {
  sections: SummarySection<SummaryItem>[];
}) {
  if (!isStarted(sections.flatMap((section) => section.items)))
    return <p className="collapsible__not-started">Not started</p>;
  const summaries = sections.map(({ label, items }) => ({
    label,
    rows: summaryRows(items),
  }));
  const shortened = summaries.some((section) =>
    section.rows.some((row) => previewText(row.value, 240) !== row.value),
  );
  return (
    <div className="collapsible__summary">
      {shortened && (
        <p className="collapsible__summary-hint">
          Long answers are shortened. Open the entry to read them in full.
        </p>
      )}
      {summaries.map((section, index) => (
        <div key={index} className="collapsible__summary-section">
          {section.label && (
            <p className="collapsible__summary-heading">{section.label}</p>
          )}
          <dl className="collapsible__summary-list">
            {section.rows.map((row, rowIndex) => (
              <div key={rowIndex} className="collapsible__summary-row">
                <dt>{row.label}</dt>
                <dd className={`collapsible__value--${row.status}`}>
                  {previewText(row.value, 240)}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      ))}
    </div>
  );
}

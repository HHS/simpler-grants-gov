import {
  isStarted,
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
  return (
    <div className="collapsible__summary">
      {sections.map((section, index) => (
        <div key={index} className="collapsible__summary-section">
          {section.label && (
            <p className="collapsible__summary-heading">{section.label}</p>
          )}
          <dl className="collapsible__summary-list">
            {summaryRows(section.items).map((row, rowIndex) => (
              <div key={rowIndex} className="collapsible__summary-row">
                <dt>{row.label}</dt>
                <dd className={`collapsible__value--${row.status}`}>
                  {row.value}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      ))}
    </div>
  );
}

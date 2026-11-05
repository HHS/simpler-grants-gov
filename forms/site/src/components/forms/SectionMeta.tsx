import type { SectionNode } from "@/content.config";

import FieldDetails from "./comparison/FieldDetails";

/**
 * What a section says about itself, laid out as a field row lays out a field: its help text,
 * and the same collapsed Details with its source IDs and widget.
 */
export default function SectionMeta({
  section,
}: {
  section: Omit<SectionNode, "children">;
}) {
  return (
    <div className="section-meta">
      {section.help_text && (
        <div className="field-row__help">{section.help_text}</div>
      )}
      <FieldDetails field={section} widget={section.widget} />
    </div>
  );
}

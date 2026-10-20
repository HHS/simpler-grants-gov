import type { FieldNode } from "@/content.config";

interface Item {
  term: string;
  value?: string;
}

function Group({ title, items }: { title: string; items: Item[] }) {
  const stated = items.filter((item) => item.value);
  if (!stated.length) return null;
  return (
    <div className="field-details__group">
      <p className="field-details__title">{title}</p>
      <dl className="field-detail-grid">
        {stated.map(({ term, value }) => (
          <div key={term} className="field-detail-grid__item">
            <dt>{term}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

/** What a field or section says about where it lives in each source and what fills it in. */
type DetailsOf = Pick<FieldNode, "dat_field" | "xml_path" | "json_path"> &
  Partial<Pick<FieldNode, "pre_populated" | "post_populated">>;

/**
 * Where a field or section lives in each source, and what fills it in, collapsed by default.
 * A section passes its `widget` too; a field shows its own beside its type instead.
 */
export default function FieldDetails({
  field,
  widget,
}: {
  field: DetailsOf;
  widget?: string;
}) {
  const ids = [
    { term: "DAT #", value: field.dat_field },
    { term: "XSD path", value: field.xml_path },
    { term: "JSON path", value: field.json_path },
  ];
  const population = [
    { term: "Pre-populated", value: field.pre_populated },
    { term: "Post-populated", value: field.post_populated },
  ];
  const rendering = [{ term: "Widget", value: widget }];
  if (![...ids, ...population, ...rendering].some((item) => item.value))
    return null;
  return (
    <details className="field-row__detail">
      <summary>Details</summary>
      <Group title="Source IDs" items={ids} />
      <Group title="Populated from other forms" items={population} />
      <Group title="Rendering" items={rendering} />
    </details>
  );
}

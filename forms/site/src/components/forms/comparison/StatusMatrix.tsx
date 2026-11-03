import { SOURCE_LABELS, SOURCES, type FieldComparison } from "@/lib/comparison";

import MatrixRow from "./MatrixRow";

/** One row per attribute and one column per source, each cell a status dot. */
export default function StatusMatrix({ field }: { field: FieldComparison }) {
  return (
    <table className="status-matrix">
      <caption className="usa-sr-only">
        How {field.field.label} compares with each source
      </caption>
      <thead>
        <tr>
          <td />
          {SOURCES.map((source) => (
            <th key={source} scope="col">
              {SOURCE_LABELS[source]}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {field.rows.map((row) => (
          <MatrixRow key={row.attribute} row={row} />
        ))}
      </tbody>
    </table>
  );
}

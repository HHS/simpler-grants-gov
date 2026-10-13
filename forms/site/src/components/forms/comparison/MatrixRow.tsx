import { ATTRIBUTE_LABELS, SOURCES, type AttributeRow } from "@/lib/comparison";

import StatusCell from "./StatusCell";

export default function MatrixRow({ row }: { row: AttributeRow }) {
  return (
    <tr>
      <th scope="row">{ATTRIBUTE_LABELS[row.attribute]}</th>
      {SOURCES.map((source) => (
        <StatusCell key={source} row={row} source={source} />
      ))}
    </tr>
  );
}

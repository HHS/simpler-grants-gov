/** Preserve exact source text while keeping long instructions out of the field scan. */
export default function FieldHelp({ text }: { text: string }) {
  const help = <div className="field-row__help">{text}</div>;
  return text.length <= 240 ? (
    help
  ) : (
    <details className="field-row__detail">
      <summary>Source help and instructions</summary>
      {help}
    </details>
  );
}

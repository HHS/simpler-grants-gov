interface Props {
  options: { missing: string[]; extra: string[] };
}

function Chips({ title, values }: { title: string; values: string[] }) {
  if (!values.length) return null;
  return (
    <div className="options-diff__group">
      <p className="options-diff__title">{title}</p>
      <ul className="options-diff__chips">
        {values.map((value) => (
          <li key={value}>{value}</li>
        ))}
      </ul>
    </div>
  );
}

/** Only the option values the form and the XSD do not share, rather than both full lists. */
export default function OptionsDiff({ options }: Props) {
  return (
    <div className="options-diff">
      <Chips
        title="Missing from Form (compared with the XSD)"
        values={options.missing}
      />
      <Chips title="Extra in Form (not in the XSD)" values={options.extra} />
    </div>
  );
}

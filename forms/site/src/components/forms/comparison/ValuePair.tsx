interface Props {
  plan: string | null;
  value: string | null;
  sourceLabel: string;
}

const shown = (value: string | null) =>
  value ?? <span className="value-pair__none">None stated</span>;

/** The plan's value beside the source's, in full. */
export default function ValuePair({ plan, value, sourceLabel }: Props) {
  return (
    <dl className="value-pair">
      <div>
        <dt>Plan</dt>
        <dd>{shown(plan)}</dd>
      </div>
      <div>
        <dt>{sourceLabel}</dt>
        <dd>{shown(value)}</dd>
      </div>
    </dl>
  );
}

/** One file or format at a time, with the same controls on Data, Schemas and Source. */
export default function FileSelector<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <ul
      className="file-selector usa-button-group usa-button-group--segmented"
      aria-label={label}
    >
      {options.map((option) => (
        <li key={option.value} className="usa-button-group__item">
          <button
            type="button"
            className={`usa-button${option.value === value ? "" : " usa-button--outline"}`}
            aria-pressed={option.value === value}
            onClick={() => onChange(option.value)}
          >
            {option.label}
          </button>
        </li>
      ))}
    </ul>
  );
}

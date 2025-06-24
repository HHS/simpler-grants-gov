export function Pill({
  label,
  onClose,
}: {
  label: string;
  onClose: () => void;
}) {
  return (
    <div>
      <span>{label}</span>
      <span
        onClick={() => {
          onClose();
        }}
      ></span>
    </div>
  );
}

import { STATUS, type Status } from "@/lib/comparison";

/** A status's color and symbol, so it never depends on color alone. */
export default function StatusDot({ status }: { status: Status }) {
  return (
    <span className={`status-dot status-dot--${status}`} aria-hidden="true">
      {STATUS[status].symbol}
    </span>
  );
}

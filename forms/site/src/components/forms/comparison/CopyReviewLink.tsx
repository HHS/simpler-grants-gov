import { currentPageState, pageUrl } from "@/stores/formPage";
import { useState } from "react";

/** Copy a stable plan-field/comparison link; the fallback link works without clipboard access. */
export default function CopyReviewLink({
  field,
  check,
}: {
  field: string;
  check?: string;
}) {
  const [status, setStatus] = useState("");
  const query = new URLSearchParams({
    tab: check ? "findings" : "fields",
    field,
  });
  if (check) query.set("check", check);
  return (
    <span>
      <button
        type="button"
        className="usa-button usa-button--unstyled"
        onClick={async () => {
          const state = {
            ...currentPageState(),
            tab: "fields" as const,
            field,
            check: check ?? null,
            sheet: check ? ("differences" as const) : ("comparison" as const),
          };
          const url = new URL(
            pageUrl(new URL(window.location.href), state),
            window.location.href,
          );
          try {
            await navigator.clipboard.writeText(url.href);
            setStatus("Copied");
          } catch {
            setStatus("Copy unavailable; use the link.");
          }
        }}
      >
        Copy link
      </button>
      <a
        href={`?${query}`}
        className="margin-left-1"
        aria-label={check ? "Open this finding" : "Open this field"}
      >
        Link
      </a>
      <span role="status" className="margin-left-1">
        {status}
      </span>
    </span>
  );
}

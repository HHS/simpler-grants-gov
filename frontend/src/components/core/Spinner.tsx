import React from "react";

const Spinner = ({ className }: { className?: string }) => (
  <span
    aria-label="Loading!"
    className={className ? `grants-spinner ${className}` : "grants-spinner"}
    role="progressbar"
  />
);

export default Spinner;

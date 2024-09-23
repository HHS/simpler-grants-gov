import React from "react";

import Spinner from "src/components/Spinner";

export default function Loading() {
  // TODO (Issue #1937): Use translation utility for strings in this file
  return (
    <div className="display-flex flex-align-center flex-justify-center margin-bottom-15 margin-top-15">
      <Spinner />
      <span className="font-body-2xl text-bold margin-left-2">
        Loading results...
      </span>
    </div>
  );
}

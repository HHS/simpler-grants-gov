import React from "react";
import Spinner from "../../components/Spinner";

export default function Loading() {
  return (
    <div className="usa-flex usa-align-center">
      <Spinner />
      <span className="margin-left-3 bold">Loading results...</span>
    </div>
  );
}

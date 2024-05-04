import React from "react";
import Spinner from "../../components/Spinner";

export default function Loading() {
  return (
    <div className="display-flex flex-align-center flex-justify-center margin-bottom-15 margin-top-15">
      <Spinner />
      <span className="font-body-2xl text-bold margin-left-2">
        Loading results...
      </span>
    </div>
  );
}

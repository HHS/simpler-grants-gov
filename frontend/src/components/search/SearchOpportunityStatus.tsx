import { Checkbox } from "@trussworks/react-uswds";
import React from "react";

export default function SearchOpportunityStatus() {
  return (
    <>
      <h4 className="margin-bottom-1">Opportunity status</h4>

      <div className="grid-row flex-wrap">
        <div className="grid-col-6 padding-right-1">
          <Checkbox
            id="status-forecasted"
            name="status-forecasted"
            label="Forecasted"
            tile={true}
            className=""
          />
        </div>
        <div className="grid-col-6 padding-right-1">
          <Checkbox
            id="status-posted"
            name="status-posted"
            label="Posted"
            tile={true}
            className=""
          />
        </div>
        <div className="grid-col-6 padding-right-1">
          <Checkbox
            id="status-closed"
            name="status-closed"
            label="Closed"
            tile={true}
            className=""
          />
        </div>
        <div className="grid-col-6 padding-right-1">
          <Checkbox
            id="status-archived"
            name="status-archived"
            label="Archived"
            tile={true}
            className=""
          />
        </div>
      </div>
    </>
  );
}

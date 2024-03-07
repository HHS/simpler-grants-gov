import React from "react";

export default function SearchOpportunityStatus() {
  return (
    <fieldset className="usa-fieldset">
      <legend className="usa-sr-only">Opportunity status</legend>
      <div className="usa-checkbox">
        <input
          className="usa-checkbox__input"
          id="checkbox-forecasted"
          type="checkbox"
          name="status"
          value="forecasted"
        />
        <label className="usa-checkbox__label" htmlFor="checkbox-forecasted">
          Forecasted
        </label>
      </div>
      <div className="usa-checkbox">
        <input
          className="usa-checkbox__input"
          id="checkbox-posted"
          type="checkbox"
          name="status"
          value="posted"
        />
        <label className="usa-checkbox__label" htmlFor="checkbox-posted">
          Posted
        </label>
      </div>
      <div className="usa-checkbox">
        <input
          className="usa-checkbox__input"
          id="checkbox-closed"
          type="checkbox"
          name="status"
          value="closed"
        />
        <label className="usa-checkbox__label" htmlFor="checkbox-closed">
          Closed
        </label>
      </div>
      <div className="usa-checkbox">
        <input
          className="usa-checkbox__input"
          id="checkbox-archived"
          type="checkbox"
          name="status"
          value="archived"
        />
        <label className="usa-checkbox__label" htmlFor="checkbox-archived">
          Archived
        </label>
      </div>
    </fieldset>
  );
}

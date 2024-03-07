import React from "react";

export default function SearchOpportunityStatus() {
  return (
    <div className="checkbox-quadrant">
      <label className="checkbox-container">
        Forecasted
        <input type="checkbox" name="forecased" />
        <span className="checkmark"></span>
      </label>
      <label className="checkbox-container">
        Posted
        <input type="checkbox" name="posted" />
        <span className="checkmark"></span>
      </label>
      <label className="checkbox-container">
        Closed
        <input type="checkbox" name="closed" />
        <span className="checkmark"></span>
      </label>
      <label className="checkbox-container">
        Archived
        <input type="checkbox" name="archived" />
        <span className="checkmark"></span>
      </label>
    </div>
  );
}

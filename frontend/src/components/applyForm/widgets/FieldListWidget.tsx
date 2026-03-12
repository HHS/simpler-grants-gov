import { JSX } from "react";

import { FieldListWidgetProps } from "src/components/applyForm/types";

function FieldListWidget(widgetProps: FieldListWidgetProps): JSX.Element {
  const { id, label, description, defaultSize } = widgetProps;

  return (
    <div id={id}>
      {label ? <h3>{label}</h3> : null}
      {description ? <p>{description}</p> : null}
      <p>
        FieldList (defaultSize:{" "}
        {typeof defaultSize === "number" ? defaultSize : "n/a"}) is not
        implemented yet.
      </p>
    </div>
  );
}

export default FieldListWidget;

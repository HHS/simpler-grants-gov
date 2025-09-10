import { render } from "@testing-library/react";
import { fakeWidgetProps } from "src/utils/testing/fixtures";

import {
  renderWidget,
  wrapSection,
} from "src/components/applyForm/widgets/WidgetRenderers";

const mockFieldsetWidget = jest.fn();
const mockWidget = jest.fn();

jest.mock("src/components/applyForm/widgets/FieldsetWidget", () => ({
  FieldsetWidget: (props: unknown) => mockFieldsetWidget(props) as unknown,
}));

jest.mock("src/components/applyForm/widgets/Widgets", () => ({
  widgetComponents: {
    widgetName: (props: unknown) => mockWidget(props) as unknown,
  },
}));

describe("wrapSection", () => {
  it("renders FieldsetWidget with correct props", () => {
    const props = {
      label: "label",
      fieldName: "fieldName",
      tree: <span>hi</span>,
      description: "description",
    };
    render(wrapSection(props));
    expect(mockFieldsetWidget).toHaveBeenCalledWith({
      label: props.label,
      fieldName: props.fieldName,
      description: props.description,
      children: props.tree,
    });
  });
});

describe("renderWidget", () => {
  it("renders the correct widget with correct props", () => {
    render(renderWidget({ props: fakeWidgetProps, type: "widgetName" }));
    expect(mockWidget).toHaveBeenCalledWith(fakeWidgetProps);
  });
  it("errors if widget is not found", () => {});
});

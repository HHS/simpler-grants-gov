import { render } from "@testing-library/react";
import { omit } from "lodash";
import { wrapForExpectedError } from "src/utils/testing/commonTestUtils";
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
    Text: (props: unknown) => mockWidget(props) as unknown,
  },
}));

describe("wrapSection", () => {
  it("renders FieldsetWidget with correct props", () => {
    const props = {
      label: "label",
      fieldName: "fieldName",
      sectionFields: <span>hi</span>,
      description: "description",
    };
    render(wrapSection(props));
    expect(mockFieldsetWidget).toHaveBeenCalledWith({
      label: props.label,
      fieldName: props.fieldName,
      description: props.description,
      children: props.sectionFields,
    });
  });
});

describe("renderWidget", () => {
  it("renders the correct widget with correct props", () => {
    render(renderWidget({ props: fakeWidgetProps, type: "Text" }));

    // key prop is stripped out by React during render
    expect(mockWidget).toHaveBeenCalledWith(omit(fakeWidgetProps, "key"));
  });
  it("errors if widget is not found", async () => {
    const error = await wrapForExpectedError(() => {
      // eslint-disable-next-line
      // @ts-ignore
      render(renderWidget({ props: fakeWidgetProps, type: "widgetType" }));
    });
    expect(error.message).toEqual("Unknown widget type: widgetType");
  });
});

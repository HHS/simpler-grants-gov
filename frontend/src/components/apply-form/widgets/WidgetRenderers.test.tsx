import { render } from "@testing-library/react";
import { TableWidgetProps } from "src/types/applyForm/types";
import { wrapForExpectedError } from "src/utils/testing/commonTestUtils";
import { fakeWidgetProps } from "src/utils/testing/fixtures";

import { renderWidget, wrapSection } from "./WidgetRenderers";

const mockFieldsetWidget = jest.fn();
const mockWidget = jest.fn();
const mockTableWidget = jest.fn();

jest.mock("src/components/apply-form/widgets/FieldsetWidget", () => ({
  FieldsetWidget: (props: unknown) => mockFieldsetWidget(props) as unknown,
}));

jest.mock("src/components/apply-form/widgets/Widgets", () => ({
  widgetComponents: {
    Text: (props: unknown) => mockWidget(props) as unknown,
    Table: (props: unknown) => mockTableWidget(props) as unknown,
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

    // React strips the reserved key prop before passing props to a component.
    const { key: _key, ...withoutKey } = fakeWidgetProps;
    expect(mockWidget).toHaveBeenCalledWith(withoutKey);
  });

  it("renders the table widget with correct props", () => {
    const tableProps: TableWidgetProps = {
      id: "budget_summary_table",
      key: "budget_summary_table",
      name: "budget_summary_table",
      uiSchemaField: {
        type: "multiField",
        name: "budget_summary_table",
        widget: "Table",
        definition: ["/properties/first_value"],
        children: {
          columns: [
            {
              columnHeader: "Item",
              width: 40,
            },
          ],
          rows: [
            {
              cells: [
                {
                  type: "plainText",
                  staticContent: "First Row",
                },
              ],
            },
          ],
        },
      },
    };

    render(
      renderWidget({
        type: "Table",
        props: tableProps as unknown as typeof fakeWidgetProps,
      }),
    );

    // React strips the reserved key prop before passing props to a component.
    const { key: _key, ...withoutKey } = tableProps;

    expect(mockTableWidget).toHaveBeenCalledWith(withoutKey);
  });

  it("errors if widget is not found", async () => {
    const error = await wrapForExpectedError(() => {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore Testing an unsupported widget type.
      render(renderWidget({ props: fakeWidgetProps, type: "widgetType" }));
    });
    expect(error.message).toEqual("Unknown widget type: widgetType");
  });
});

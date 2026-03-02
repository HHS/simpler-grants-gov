import { FormContextType, RJSFSchema } from "@rjsf/utils";
import { fireEvent, render, screen } from "@testing-library/react";

import { GeneralRecord } from "src/components/applyForm/types";
import Budget424aSectionF from "src/components/applyForm/widgets/budget/Budget424aSectionF";

function buildRootSchema(): RJSFSchema {
  return {
    type: "object",
    properties: {
      direct_charges_explanation: {
        type: "string",
        title: "Direct charges",
        maxLength: 4000,
      },
      indirect_charges_explanation: {
        type: "string",
        title: "Indirect charges",
        maxLength: 4000,
      },
      remarks: {
        type: "string",
        title: "Remarks",
        maxLength: 4000,
      },
      confirmation: {
        type: "boolean",
        title:
          "I confirm the information in this section is accurate to the best of my knowledge.",
      },
    },
  };
}

function buildWidgetProps(value: GeneralRecord) {
  const formContext: { rootSchema: RJSFSchema } = {
    rootSchema: buildRootSchema(),
  };

  return {
    id: "section-f",
    schema: {},
    value,
    rawErrors: [] as string[],
    formContext,
  };
}

describe("Budget424aSectionF", () => {
  it("renders text areas with values and the confirmation checkbox", () => {
    const value: GeneralRecord = {
      direct_charges_explanation: "Direct notes",
      indirect_charges_explanation: "Indirect notes",
      remarks: "Some remarks",
      confirmation: true,
    };

    render(
      <Budget424aSectionF<GeneralRecord, RJSFSchema, FormContextType>
        {...buildWidgetProps(value)}
      />,
    );

    expect(screen.getByRole("textbox", { name: "Direct charges" })).toHaveValue(
      "Direct notes",
    );
    expect(
      screen.getByRole("textbox", { name: "Indirect charges" }),
    ).toHaveValue("Indirect notes");
    expect(screen.getByRole("textbox", { name: "Remarks" })).toHaveValue(
      "Some remarks",
    );

    const checkbox = screen.getByRole("checkbox", {
      name: /I confirm the information in this section is accurate to the best of my knowledge\./i,
    });
    expect(checkbox).toBeChecked();
  });

  it("emits updated value when toggling the confirmation checkbox", () => {
    const initialValue: GeneralRecord = {
      direct_charges_explanation: "A",
      indirect_charges_explanation: "B",
      remarks: "C",
      confirmation: false,
    };

    const onChangeTyped = jest.fn<void, [GeneralRecord]>();

    const onChangeAdapter: (value: unknown) => void = (value) => {
      onChangeTyped(value as GeneralRecord);
    };

    render(
      <Budget424aSectionF<GeneralRecord, RJSFSchema, FormContextType>
        {...buildWidgetProps(initialValue)}
        onChange={onChangeAdapter}
      />,
    );

    const checkbox = screen.getByRole("checkbox", {
      name: /I confirm the information in this section is accurate to the best of my knowledge\./i,
    });

    fireEvent.click(checkbox);

    expect(onChangeTyped).toHaveBeenCalledTimes(1);
    const nextValue = onChangeTyped.mock.calls[0][0];
    expect(nextValue).toEqual({
      ...initialValue,
      confirmation: true,
    });
  });

  it("renders based on schema even when values are missing", () => {
    const emptyValue: GeneralRecord = {};

    render(
      <Budget424aSectionF<GeneralRecord, RJSFSchema, FormContextType>
        {...buildWidgetProps(emptyValue)}
      />,
    );

    expect(
      screen.getByRole("textbox", { name: "Direct charges" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("textbox", { name: "Indirect charges" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("textbox", { name: "Remarks" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("checkbox", {
        name: /I confirm the information in this section is accurate to the best of my knowledge\./i,
      }),
    ).toBeInTheDocument();
  });
});

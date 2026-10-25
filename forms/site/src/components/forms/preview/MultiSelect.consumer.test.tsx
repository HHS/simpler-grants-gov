// @vitest-environment jsdom
import {
  RuleEffect,
  type JsonSchema7,
  type UISchemaElement,
} from "@jsonforms/core";
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import { useState } from "react";
import { afterEach, expect, it } from "vitest";

import { SggFormRenderer } from "./SggFormRenderer";

// A minimal nested enum-array contract exercises the stock MultiSelect, USWDS
// ComboBox/pills and real native preview collection without a form-specific fixture.
const spec: { schema: JsonSchema7; uischema: UISchemaElement } = {
  schema: {
    type: "object",
    properties: {
      selection_block: {
        type: "object",
        properties: {
          selections: {
            title: "Choose categories",
            type: "array",
            maxItems: 8,
            items: {
              type: "string",
              enum: Array.from({ length: 8 }, (_, i) => `E${i + 1}`),
            },
          },
          notes: { type: "string", title: "Selection notes" },
        },
      },
    },
  },
  uischema: {
    type: "VerticalLayout",
    elements: [
      {
        type: "Control",
        scope: "#/properties/selection_block/properties/selections",
        label: "Choose categories",
        options: { widget: "MultiSelect" },
      },
      {
        type: "Control",
        scope: "#/properties/selection_block/properties/notes",
        label: "Selection notes",
        options: { widget: "Text" },
        rule: {
          effect: RuleEffect.ENABLE,
          condition: {
            scope: "#/properties/selection_block/properties/selections",
            schema: { type: "array", minItems: 2 },
            failWhenUndefined: true,
          },
        },
      },
    ],
  },
};
afterEach(cleanup);

const initial = (numbers?: string[]) =>
  numbers ? { selection_block: { selections: numbers } } : {};
function Preview({ numbers }: { numbers?: string[] }) {
  const [data, setData] = useState<unknown>(() => initial(numbers));
  const [checked, setChecked] = useState(false);
  return (
    <>
      <SggFormRenderer
        {...spec}
        data={data}
        showErrors={checked}
        onChange={(next) => setData(next)}
      />
      <button
        type="button"
        onClick={() => {
          setData(structuredClone(data));
          setChecked(true);
        }}
      >
        Check immediately
      </button>
      <output data-testid="answers">{JSON.stringify(data)}</output>
    </>
  );
}
const numbers = () => {
  const data = JSON.parse(screen.getByTestId("answers").textContent ?? "null");
  return data.selection_block?.selections;
};
async function clickNumber(number: string) {
  const combo = screen.getByRole("combobox", {
    name: /Choose categories/,
  });
  fireEvent.input(combo, { target: { value: number } });
  await act(async () => {});
  fireEvent.click(
    screen.getByRole("option", { name: new RegExp(`^${number}$`) }),
  );
  await act(async () => {});
}

it("publishes the last visible MultiSelect addition before immediate Check without a sibling edit", async () => {
  render(<Preview />);
  await clickNumber("E1");
  await clickNumber("E8");
  expect(screen.getByRole("button", { name: "Remove E1 pill" })).toBeTruthy();
  expect(screen.getByRole("button", { name: "Remove E8 pill" })).toBeTruthy();
  expect(numbers()).toEqual(["E1", "E8"]);
  fireEvent.click(screen.getByRole("button", { name: "Check immediately" }));
  await act(async () => {});
  expect(numbers()).toEqual(["E1", "E8"]);
  expect(screen.getByRole("button", { name: "Remove E8 pill" })).toBeTruthy();
});

it("publishes pill removal before immediate Check without resurrecting the removed selection", async () => {
  render(<Preview numbers={["E1", "E8"]} />);
  fireEvent.click(screen.getByRole("button", { name: "Remove E8 pill" }));
  await act(async () => {});
  expect(screen.queryByRole("button", { name: "Remove E8 pill" })).toBeNull();
  expect(numbers()).toEqual(["E1"]);
  fireEvent.click(screen.getByRole("button", { name: "Check immediately" }));
  await act(async () => {});
  expect(numbers()).toEqual(["E1"]);
  expect(screen.queryByRole("button", { name: "Remove E8 pill" })).toBeNull();
});

it("collects all eight choices in order and clears every pill before Check without resurrecting answers", async () => {
  render(<Preview />);
  const allNumbers = Array.from({ length: 8 }, (_, index) => `E${index + 1}`);
  for (const number of allNumbers) await clickNumber(number);
  expect(numbers()).toEqual(allNumbers);
  const combo = screen.getByRole("combobox", {
    name: /Choose categories/,
  }) as HTMLInputElement;
  expect(combo.disabled).toBe(true);
  fireEvent.click(screen.getByRole("button", { name: "Check immediately" }));
  await act(async () => {});
  expect(numbers()).toEqual(allNumbers);
  for (const number of allNumbers) {
    fireEvent.click(
      screen.getByRole("button", { name: `Remove ${number} pill` }),
    );
    await act(async () => {});
  }
  expect(numbers()).toBeUndefined();
  expect(
    screen.queryAllByRole("button", { name: /Remove E[1-8] pill/ }),
  ).toHaveLength(0);
  fireEvent.click(screen.getByRole("button", { name: "Check immediately" }));
  await act(async () => {});
  expect(numbers()).toBeUndefined();
  expect(
    screen.queryAllByRole("button", { name: /Remove E[1-8] pill/ }),
  ).toHaveLength(0);
});

it("publishes a keyboard Enter addition before Check after the earlier typing event has settled", async () => {
  render(<Preview numbers={["E1"]} />);
  const combo = screen.getByRole("combobox", {
    name: /Choose categories/,
  });
  fireEvent.input(combo, { target: { value: "E8" } });
  // Typing and pressing Enter are separate browser gestures. Flushing here makes
  // the test refuse to borrow the typing event's pending collection as a repair.
  await act(async () => {});
  fireEvent.keyDown(combo, { key: "Enter", code: "Enter" });
  await act(async () => {});
  expect(screen.getByRole("button", { name: "Remove E8 pill" })).toBeTruthy();
  expect(numbers()).toEqual(["E1", "E8"]);
  fireEvent.click(screen.getByRole("button", { name: "Check immediately" }));
  await act(async () => {});
  expect(numbers()).toEqual(["E1", "E8"]);
});

it("refreshes the rule consumer from the same committed choices as live Data", async () => {
  render(<Preview />);
  expect(
    (
      screen.getByRole("textbox", {
        name: "Selection notes",
      }) as HTMLInputElement
    ).disabled,
  ).toBe(true);
  await clickNumber("E1");
  await clickNumber("E8");
  expect(
    (
      screen.getByRole("textbox", {
        name: "Selection notes",
      }) as HTMLInputElement
    ).disabled,
  ).toBe(false);
  fireEvent.click(screen.getByRole("button", { name: "Remove E8 pill" }));
  await act(async () => {});
  expect(numbers()).toEqual(["E1"]);
  expect(
    (
      screen.getByRole("textbox", {
        name: "Selection notes",
      }) as HTMLInputElement
    ).disabled,
  ).toBe(true);
});

// @vitest-environment jsdom
import type { JsonSchema7, UISchemaElement } from "@jsonforms/core";
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import { useState } from "react";
import { afterEach, expect, it } from "vitest";

import { SggFormRenderer } from "../SggFormRenderer";

const USA = "USA: UNITED STATES";
const CAN = "CAN: CANADA";
const schema: JsonSchema7 = {
  type: "object",
  properties: {
    workplaces: {
      type: "array",
      maxItems: 10,
      items: {
        type: "object",
        properties: {
          country: { type: "string", title: "Country", enum: [USA, CAN] },
          state: {
            type: "string",
            title: "State",
            enum: ["VA: Virginia", "NY: New York"],
          },
          province: { type: "string", title: "Province" },
        },
      },
    },
    project: { type: "string", title: "Project" },
  },
};
const condition = {
  scope: "#/properties/country",
  schema: { const: USA },
  failWhenUndefined: true,
};
const uischema = {
  type: "VerticalLayout",
  elements: [
    {
      type: "Control",
      scope: "#/properties/workplaces",
      label: "Workplaces",
      options: {
        widget: "CollapsibleFieldList",
        detail: {
          type: "VerticalLayout",
          elements: [
            {
              type: "Control",
              scope: "#/properties/country",
              options: { widget: "Select" },
            },
            {
              type: "Control",
              scope: "#/properties/state",
              options: { widget: "Select" },
              rule: { effect: "ENABLE", condition },
            },
            {
              type: "Control",
              scope: "#/properties/province",
              options: { widget: "Text" },
              rule: { effect: "DISABLE", condition },
            },
          ],
        },
      },
    },
    {
      type: "Control",
      scope: "#/properties/project",
      options: { widget: "Text" },
    },
  ],
} as UISchemaElement;
const initial = {
  workplaces: [
    { country: USA, state: "VA: Virginia", province: "Retained USA province" },
    { country: CAN, state: "NY: New York", province: "Ontario" },
  ],
  project: "Initial project",
};
function Preview() {
  const [data, setData] = useState<unknown>(structuredClone(initial));
  const [checked, setChecked] = useState(false);
  return (
    <>
      <SggFormRenderer
        schema={schema}
        uischema={uischema}
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
const answers = () =>
  JSON.parse(screen.getByTestId("answers").textContent ?? "null");
afterEach(cleanup);
const committed = async (action: () => void) => {
  await act(async () => {
    action();
  });
};

it("evaluates country rules for each real list row and retains current inactive values across edits and Check", async () => {
  const view = render(<Preview />);
  const named = (name: string) =>
    view.container.querySelector(`[name="${name}"]`) as
      HTMLInputElement | HTMLSelectElement;
  expect(named("workplaces[0]--state").disabled).toBe(false);
  expect(named("workplaces[0]--province").disabled).toBe(true);
  expect(named("workplaces[1]--state").disabled).toBe(true);
  expect(named("workplaces[1]--province").disabled).toBe(false);
  // Expand before interacting, as an applicant does; entry0 is initially collapsed.
  await committed(() =>
    fireEvent.click(screen.getAllByRole("button", { name: "Edit" })[0]),
  );
  await committed(() =>
    fireEvent.change(named("workplaces[0]--country"), {
      target: { value: CAN },
    }),
  );
  expect(named("workplaces[0]--state").disabled).toBe(true);
  expect(named("workplaces[0]--province").disabled).toBe(false);
  await committed(() =>
    fireEvent.input(named("workplaces[0]--province"), {
      target: { value: "Current Quebec" },
    }),
  );
  await committed(() =>
    fireEvent.change(named("workplaces[0]--country"), {
      target: { value: USA },
    }),
  );
  expect(named("workplaces[0]--province").disabled).toBe(true);
  await committed(() =>
    fireEvent.input(named("project"), { target: { value: "Sibling edit" } }),
  );
  expect(answers()).toEqual({
    ...initial,
    workplaces: [
      { ...initial.workplaces[0], province: "Current Quebec" },
      initial.workplaces[1],
    ],
    project: "Sibling edit",
  });
  await committed(() =>
    fireEvent.click(screen.getByRole("button", { name: "Check immediately" })),
  );
  expect(answers().workplaces[0].province).toBe("Current Quebec");
  expect(answers().workplaces[1].state).toBe("NY: New York");
});

it("publishes deletion before Check without a sibling input and never resurrects the removed row", async () => {
  render(<Preview />);
  await committed(() =>
    fireEvent.click(screen.getAllByRole("button", { name: "Delete" })[1]),
  );
  // A DOM-only collector test misses this event boundary: Check clones the reported data.
  expect(answers().workplaces).toEqual([initial.workplaces[0]]);
  await committed(() =>
    fireEvent.click(screen.getByRole("button", { name: "Check immediately" })),
  );
  expect(answers().workplaces).toEqual([initial.workplaces[0]]);
  expect(screen.getAllByRole("button", { name: "Delete" })).toHaveLength(1);
});

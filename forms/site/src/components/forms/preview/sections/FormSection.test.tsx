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

const schema: JsonSchema7 = {
  type: "object",
  properties: {
    grant: { type: "string", title: "Grant answer" },
    fase: { type: "string", title: "FASE answer" },
    context: { type: "string", title: "Supplied context", readOnly: true },
  },
};
const uischema = {
  type: "Group",
  elements: [
    {
      type: "Group",
      label: "Grant guidance",
      options: {
        widget: "SectionHelp",
        description: "Grant source definitions.",
      },
      elements: [{ type: "Control", scope: "#/properties/grant" }],
    },
    {
      type: "Group",
      label: "FASE guidance",
      options: {
        widget: "SectionHelp",
        description: "FASE source definitions.",
      },
      elements: [{ type: "Control", scope: "#/properties/fase" }],
    },
    {
      type: "Group",
      label: "Essential instructions",
      options: {
        description: "Essential source instructions remain expanded.",
      },
      elements: [{ type: "Control", scope: "#/properties/context" }],
    },
  ],
} as UISchemaElement;
const initial = {
  grant: "Standard",
  fase: "Retained subtype",
  context: "Supplied",
};
function Preview() {
  const [data, setData] = useState<unknown>(initial);
  return (
    <>
      <SggFormRenderer
        schema={schema}
        uischema={uischema}
        data={data}
        showErrors={false}
        onChange={(next) => setData(next)}
      />
      <output data-testid="answers">{JSON.stringify(data)}</output>
    </>
  );
}
afterEach(cleanup);

it("discloses only opted-in descriptions while real controls stay usable and context/data stay intact", async () => {
  render(<Preview />);
  const grantSummary = screen.getByLabelText(
    "Grant guidance: instructions and option definitions",
  );
  const faseSummary = screen.getByLabelText(
    "FASE guidance: instructions and option definitions",
  );
  const grantHelp = grantSummary.closest("details")!;
  const faseHelp = faseSummary.closest("details")!;
  expect(grantSummary).not.toBe(faseSummary);
  expect(grantHelp.open).toBe(false);
  expect(faseHelp.open).toBe(false);
  expect(grantHelp.textContent).toContain("Grant source definitions.");
  expect(faseHelp.textContent).toContain("FASE source definitions.");
  const grant = screen.getByRole("textbox", { name: "Grant answer" });
  const fase = screen.getByRole("textbox", { name: "FASE answer" });
  expect(grant.closest("details")).toBeNull();
  expect(fase.closest("details")).toBeNull();
  const essential = screen.getByText(
    "Essential source instructions remain expanded.",
  );
  expect(essential.closest("details")).toBeNull();
  expect(
    (
      screen.getByRole("textbox", {
        name: "Supplied context",
      }) as HTMLInputElement
    ).disabled,
  ).toBe(true);

  fireEvent.input(grant, {
    target: { value: "Applicant edit with help closed" },
  });
  await act(async () => {});
  const expected = { ...initial, grant: "Applicant edit with help closed" };
  const answers = () =>
    JSON.parse(screen.getByTestId("answers").textContent ?? "null");
  expect(answers()).toEqual(expected);
  fireEvent.click(grantSummary);
  await act(async () => {});
  expect(grantHelp.open).toBe(true);
  expect(faseHelp.open).toBe(false);
  expect(answers()).toEqual(expected);
  fireEvent.click(grantSummary);
  await act(async () => {});
  expect(grantHelp.open).toBe(false);
  expect(screen.getByRole("textbox", { name: "Grant answer" })).toBe(grant);
  expect(answers()).toEqual(expected);
});

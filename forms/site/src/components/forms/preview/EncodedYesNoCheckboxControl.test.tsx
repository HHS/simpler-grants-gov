// @vitest-environment jsdom
import type {
  ControlElement,
  ControlProps,
  JsonSchema7,
} from "@jsonforms/core";
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import { useState } from "react";
import { flushSync } from "react-dom";
import { afterEach, describe, expect, it } from "vitest";

import {
  EncodedYesNoCheckboxControl,
  isEncodedYesNoSchema,
} from "./EncodedYesNoCheckboxControl";
import { previewRenderers } from "./renderers";
import { SggFormRenderer } from "./SggFormRenderer";

const sourceSchema: JsonSchema7 = { type: "string", enum: ["Y: Yes", "N: No"] };
const props = (changes: Partial<ControlProps> = {}) =>
  ({
    data: undefined,
    path: "on_file",
    label: "Other workplaces on file",
    description: "Check to select.",
    required: false,
    enabled: true,
    visible: true,
    readonly: false,
    schema: sourceSchema,
    ...changes,
  }) as ControlProps;
afterEach(cleanup);

const entries = (container: HTMLElement) => [
  ...new FormData(container.querySelector("form")!).entries(),
];
const labelClick = () =>
  fireEvent.click(
    screen.getByText("Other workplaces on file", { selector: "label" }),
  );

describe("source-encoded YesNo Checkbox library extension", () => {
  it("selects only the exact string domain on the existing Checkbox widget", () => {
    const ui: ControlElement = {
      type: "Control",
      scope: "#/properties/answer",
      options: { widget: "Checkbox" },
    };
    const rank = (schema: JsonSchema7, control = ui) =>
      Math.max(
        ...previewRenderers.map((entry) =>
          entry.tester(
            control,
            { type: "object", properties: { answer: schema } },
            {
              rootSchema: { type: "object", properties: { answer: schema } },
              config: {},
            },
          ),
        ),
      );
    expect(rank(sourceSchema)).toBe(20);
    expect(rank({ type: "string", enum: ["N: No", "Y: Yes"] })).toBe(20);
    for (const schema of [
      { type: "boolean" },
      { type: "string", enum: ["Yes", "No"] },
      { type: "string", enum: ["Y: Yes", "N: No", "Other"] },
    ]) {
      expect(isEncodedYesNoSchema(schema)).toBe(false);
      expect(rank(schema)).toBe(-1);
    }
    expect(rank(sourceSchema, { ...ui, options: { widget: "Radio" } })).toBe(
      -1,
    );
  });

  it("keeps untouched absence, then publishes Y and deliberate N after the hidden value commits", () => {
    let reported: [string, FormDataEntryValue][][] = [];
    const view = render(
      <form
        onInput={(event) =>
          reported.push([...new FormData(event.currentTarget).entries()])
        }
      >
        <EncodedYesNoCheckboxControl {...props()} />
      </form>,
    );
    expect(entries(view.container)).toEqual([]);
    expect(reported).toEqual([]);
    labelClick();
    expect((screen.getByRole("checkbox") as HTMLInputElement).checked).toBe(
      true,
    );
    expect(entries(view.container)).toEqual([["on_file", "Y: Yes"]]);
    expect(reported.at(-1)).toEqual([["on_file", "Y: Yes"]]);
    expect(
      reported
        .flat()
        .some(([, value]) => value === "true" || value === "false"),
    ).toBe(false);
    labelClick();
    expect((screen.getByRole("checkbox") as HTMLInputElement).checked).toBe(
      false,
    );
    expect(entries(view.container)).toEqual([["on_file", "N: No"]]);
    expect(reported.at(-1)).toEqual([["on_file", "N: No"]]);
  });

  it("loads N unchecked and keeps encoded values through sibling edits and external sample replacement", () => {
    const view = render(
      <form>
        <EncodedYesNoCheckboxControl key="no" {...props({ data: "N: No" })} />
        <input aria-label="Sibling" name="sibling" defaultValue="initial" />
      </form>,
    );
    expect((screen.getByRole("checkbox") as HTMLInputElement).checked).toBe(
      false,
    );
    fireEvent.input(screen.getByLabelText("Sibling"), {
      target: { value: "edited" },
    });
    expect(entries(view.container)).toEqual([
      ["on_file", "N: No"],
      ["sibling", "edited"],
    ]);
    view.rerender(
      <form>
        <EncodedYesNoCheckboxControl key="yes" {...props({ data: "Y: Yes" })} />
        <input aria-label="Sibling" name="sibling" defaultValue="initial" />
      </form>,
    );
    expect((screen.getByRole("checkbox") as HTMLInputElement).checked).toBe(
      true,
    );
    fireEvent.input(screen.getByLabelText("Sibling"), {
      target: { value: "again" },
    });
    expect(entries(view.container)).toEqual([
      ["on_file", "Y: Yes"],
      ["sibling", "again"],
    ]);
  });

  it("uses existing native field names for a nested repeated role", () => {
    const view = render(
      <form>
        <EncodedYesNoCheckboxControl
          {...props({ data: "Y: Yes", path: "people.0.on_file" })}
        />
      </form>,
    );
    expect(entries(view.container)).toEqual([["people[0]--on_file", "Y: Yes"]]);
  });

  it("honors disabled, direct readonly and inherited source-owned objects", () => {
    for (const changes of [
      { enabled: false },
      { readonly: true },
      { schema: { ...sourceSchema, readOnly: true } },
    ]) {
      const view = render(
        <form>
          <EncodedYesNoCheckboxControl
            {...props({ data: "Y: Yes", ...changes })}
          />
        </form>,
      );
      expect((screen.getByRole("checkbox") as HTMLInputElement).disabled).toBe(
        true,
      );
      labelClick();
      expect((screen.getByRole("checkbox") as HTMLInputElement).checked).toBe(
        true,
      );
      expect(entries(view.container)).toEqual([]);
      cleanup();
    }
    render(
      <form>
        <EncodedYesNoCheckboxControl
          {...props({
            data: "Y: Yes",
            path: "owned.answer",
            rootSchema: {
              type: "object",
              properties: {
                owned: {
                  type: "object",
                  readOnly: true,
                  properties: { answer: sourceSchema },
                },
              },
            },
            uischema: {
              type: "Control",
              scope: "#/properties/owned/properties/answer",
            },
          })}
        />
      </form>,
    );
    expect((screen.getByRole("checkbox") as HTMLInputElement).disabled).toBe(
      true,
    );
  });
});

const formSchema: JsonSchema7 = {
  type: "object",
  properties: {
    on_file: { ...sourceSchema, title: "Other workplaces on file" },
    project: { type: "string", title: "Project" },
  },
};
const formUi = {
  type: "VerticalLayout",
  elements: [
    {
      type: "Control",
      scope: "#/properties/on_file",
      options: { widget: "Checkbox" },
    },
    {
      type: "Control",
      scope: "#/properties/project",
      options: { widget: "Text" },
    },
  ],
};
function ActualPreview({ initial }: { initial: object }) {
  const [data, setData] = useState<unknown>(initial);
  const [showErrors, setShowErrors] = useState(false);
  return (
    <>
      <SggFormRenderer
        schema={formSchema}
        uischema={formUi}
        data={data}
        showErrors={showErrors}
        onChange={(next) => setData(next)}
      />
      <button type="button" onClick={() => setShowErrors(true)}>
        Check
      </button>
      <button type="button" onClick={() => setData({ on_file: "N: No" })}>
        Load no
      </button>
      <button type="button" onClick={() => setData({})}>
        Clear
      </button>
      <output data-testid="answers">{JSON.stringify(data)}</output>
    </>
  );
}
const answers = () =>
  JSON.parse(screen.getByTestId("answers").textContent ?? "null");

const committed = async (action: () => void) => {
  await act(async () => {
    action();
  });
};

it("preserves absent/Y/N through the actual native preview collector, rule refresh, sibling edit and Check", async () => {
  render(<ActualPreview initial={{}} />);
  await committed(() =>
    fireEvent.input(screen.getByRole("textbox"), {
      target: { value: "first project" },
    }),
  );
  expect(answers()).toEqual({ project: "first project" });
  await committed(labelClick);
  expect(answers()).toEqual({ on_file: "Y: Yes", project: "first project" });
  await committed(() =>
    fireEvent.input(screen.getByRole("textbox"), {
      target: { value: "edited project" },
    }),
  );
  expect(answers()).toEqual({ on_file: "Y: Yes", project: "edited project" });
  await committed(() =>
    fireEvent.click(screen.getByRole("button", { name: "Check" })),
  );
  expect((screen.getByRole("checkbox") as HTMLInputElement).checked).toBe(true);
  await committed(labelClick);
  expect(answers()).toEqual({ on_file: "N: No", project: "edited project" });
  await committed(() =>
    fireEvent.input(screen.getByRole("textbox"), {
      target: { value: "third project" },
    }),
  );
  expect(answers()).toEqual({ on_file: "N: No", project: "third project" });
  await committed(() =>
    fireEvent.click(screen.getByRole("button", { name: "Load no" })),
  );
  expect((screen.getByRole("checkbox") as HTMLInputElement).checked).toBe(
    false,
  );
  expect(answers()).toEqual({ on_file: "N: No" });
});

it("does not turn a loaded Y sample into boolean true when a sibling changes", async () => {
  render(<ActualPreview initial={{ on_file: "Y: Yes", project: "loaded" }} />);
  await committed(() =>
    fireEvent.input(screen.getByRole("textbox"), {
      target: { value: "changed sibling" },
    }),
  );
  expect(answers()).toEqual({ on_file: "Y: Yes", project: "changed sibling" });
});

it("does not let a queued old-form collection overwrite an external sample or Clear", async () => {
  render(<ActualPreview initial={{ on_file: "Y: Yes", project: "loaded" }} />);
  // Commit external data while a read is queued. Uncommitted batched parent intent
  // is not yet a prop the renderer can observe; flushSync makes this boundary explicit.
  await committed(() => {
    fireEvent.input(screen.getByRole("textbox"), {
      target: { value: "stale edit" },
    });
    flushSync(() =>
      fireEvent.click(screen.getByRole("button", { name: "Load no" })),
    );
  });
  expect(answers()).toEqual({ on_file: "N: No" });
  expect((screen.getByRole("checkbox") as HTMLInputElement).checked).toBe(
    false,
  );
  await committed(() => {
    fireEvent.input(screen.getByRole("textbox"), {
      target: { value: "another stale edit" },
    });
    flushSync(() =>
      fireEvent.click(screen.getByRole("button", { name: "Clear" })),
    );
  });
  expect(answers()).toEqual({});
  expect((screen.getByRole("checkbox") as HTMLInputElement).checked).toBe(
    false,
  );
});

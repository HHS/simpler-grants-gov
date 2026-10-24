// @vitest-environment jsdom
import type { ControlElement } from "@jsonforms/core";
import type { RJSFSchema } from "@rjsf/utils";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { AdapterContext } from "../../../../vendor/sgg/renderers";
import { CollapsibleListControl } from "./CollapsibleFieldList";

// Exercise the list/adapter state boundary independently of the native child widgets.
vi.mock("@sgg/frontend/components/apply-form/widgets/WidgetRenderers", () => ({
  renderWidget: ({ props }: { props: Record<string, unknown> }) => (
    <input
      key={String(props.id)}
      name={String(props.name)}
      defaultValue={String(props.value ?? "")}
      onInput={(event) =>
        (props.onChange as (value: string) => void)(event.currentTarget.value)
      }
    />
  ),
}));

const schema: RJSFSchema = {
  type: "object",
  properties: {
    people: {
      type: "array",
      minItems: 1,
      maxItems: 4,
      items: {
        type: "object",
        properties: { name: { type: "string", title: "Name" } },
      },
    },
  },
};
const control: ControlElement = {
  type: "Control",
  scope: "#/properties/people",
  options: { widget: "CollapsibleFieldList" },
};

describe("collapsible list draft ownership", () => {
  let host: HTMLDivElement;
  let root: Root;
  const report = vi.fn();
  const bubblingInput = vi.fn();

  beforeEach(async () => {
    host = document.createElement("div");
    document.body.append(host);
    root = createRoot(host);
    report.mockClear();
    bubblingInput.mockClear();
    await act(async () => {
      root.render(
        <div onInput={bubblingInput}>
          <AdapterContext.Provider
            value={{
              schema,
              formData: { people: [{ name: "A" }, { name: "B" }] },
              errors: null,
              requiredFieldPaths: [],
              rootUiSchema: control,
              onFieldListChange: report,
            }}
          >
            <CollapsibleListControl
              uischema={control}
              visible={true}
              enabled={true}
              schema={{ type: "array" }}
              rootSchema={{ type: "object" }}
              data={[]}
              label="People"
              errors=""
              id="people"
              path="people"
              handleChange={vi.fn()}
            />
          </AdapterContext.Provider>
        </div>,
      );
    });
  });

  afterEach(async () => {
    await act(async () => root.unmount());
    host.remove();
  });

  const buttons = (label: string) =>
    [...host.querySelectorAll("button")].filter(
      (button) => button.textContent?.trim() === label,
    );
  const click = async (label: string, index = 0) => {
    await act(async () => buttons(label)[index].click());
  };

  it("reports deletions and blank additions immediately, then isolates re-added row edits", async () => {
    await click("Delete");
    expect(report).toHaveBeenLastCalledWith("people", [{ name: "B" }]);
    await click("Add entry");
    expect(report).toHaveBeenLastCalledWith("people", [{ name: "B" }, {}]);
    const input = host.querySelector<HTMLInputElement>(
      'input[name="people[1]--name"]',
    )!;
    await act(async () => {
      input.value = "C";
      input.dispatchEvent(new Event("input", { bubbles: true }));
    });
    expect(report).toHaveBeenLastCalledWith("people", [
      { name: "B" },
      { name: "C" },
    ]);
    expect(bubblingInput).not.toHaveBeenCalled();
  });

  it("keeps collapse/edit view-only and preserves both edits batched before a render", async () => {
    await click("Edit");
    expect(report).not.toHaveBeenCalled();
    const inputs = host.querySelectorAll("input");
    await act(async () => {
      inputs[0].value = "A changed";
      inputs[0].dispatchEvent(new Event("input", { bubbles: true }));
      inputs[1].value = "B changed";
      inputs[1].dispatchEvent(new Event("input", { bubbles: true }));
    });
    expect(report).toHaveBeenLastCalledWith("people", [
      { name: "A changed" },
      { name: "B changed" },
    ]);
    report.mockClear();
    await click("Collapse");
    expect(report).not.toHaveBeenCalled();
  });

  it("keeps the source cardinality controls after repeated delete/add cycles", async () => {
    await click("Delete");
    expect(buttons("Delete")[0].disabled).toBe(true);
    for (let n = 0; n < 3; n++) await click("Add entry");
    expect(buttons("Add entry")[0].disabled).toBe(true);
    expect(report).toHaveBeenLastCalledWith("people", [
      { name: "B" },
      {},
      {},
      {},
    ]);
  });
});

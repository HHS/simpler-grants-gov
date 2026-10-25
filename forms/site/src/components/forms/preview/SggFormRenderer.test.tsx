// @vitest-environment jsdom
import type { JsonSchema, UISchemaElement } from "@jsonforms/core";
import { act, useCallback, useState } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { SggFormRenderer } from "./SggFormRenderer";

const schema: JsonSchema = {
  type: "object",
  required: ["code", "choice", "submission"],
  properties: {
    code: {
      type: "string",
      title: "Last four digits",
      minLength: 4,
      maxLength: 4,
      pattern: "^[0-9]{4}$",
    },
    choice: { type: "string", title: "Confirmed", enum: ["Y: Yes", "N: No"] },
    submission: {
      type: "object",
      readOnly: true,
      required: ["signature"],
      properties: { signature: { type: "string", title: "Signature" } },
    },
  },
};
const uischema: UISchemaElement = {
  type: "VerticalLayout",
  elements: [
    {
      type: "Control",
      scope: "#/properties/code",
      options: { widget: "Text" },
    },
    {
      type: "Control",
      scope: "#/properties/choice",
      options: { widget: "Radio" },
    },
    { type: "Control", scope: "#/properties/submission" },
  ],
} as UISchemaElement;

// Keep the real renderer, native widgets, warning formatter and collector in this test.
describe("SGG preview validation while editing", () => {
  let host: HTMLDivElement;
  let root: Root;
  let currentData: unknown;

  function Preview() {
    const [data, setData] = useState<unknown>({
      code: "12",
      choice: "N: No",
      submission: { signature: "Synthetic submission context" },
    });
    const onChange = useCallback((next: unknown) => {
      currentData = next;
      setData(next);
    }, []);
    return (
      <SggFormRenderer
        schema={schema}
        uischema={uischema}
        data={data}
        showErrors={true}
        onChange={onChange}
      />
    );
  }

  beforeEach(async () => {
    vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
    host = document.createElement("div");
    document.body.append(host);
    root = createRoot(host);
    await act(async () => root.render(<Preview />));
  });

  afterEach(async () => {
    await act(async () => root.unmount());
    host.remove();
    vi.unstubAllGlobals();
  });

  it("refreshes inline warnings without replacing the focused native input or losing context", async () => {
    const code = host.querySelector<HTMLInputElement>('input[name="code"]')!;
    const signature = host.querySelector<HTMLInputElement>(
      'input[name="submission--signature"]',
    )!;
    expect(code).not.toBeNull();
    expect(signature.disabled).toBe(true);
    expect(host.querySelectorAll(".usa-error-message").length).toBeGreaterThan(
      0,
    );
    code.focus();

    const enterCode = async (value: string) => {
      await act(async () => {
        code.value = value;
        code.dispatchEvent(new Event("input", { bubbles: true }));
      });
      expect(host.querySelector('input[name="code"]')).toBe(code);
      expect(document.activeElement).toBe(code);
      expect(currentData).toEqual({
        ...(value ? { code: value } : {}),
        choice: "N: No",
        submission: { signature: "Synthetic submission context" },
      });
    };

    await enterCode("0012");
    expect(host.querySelectorAll(".usa-error-message")).toHaveLength(0);
    expect(
      host.querySelector<HTMLInputElement>(
        'input[type="radio"][value="N: No"]',
      )!.checked,
    ).toBe(true);

    await enterCode("");
    expect(host.querySelectorAll(".usa-error-message").length).toBeGreaterThan(
      0,
    );
    await enterCode("9876");
    expect(host.querySelectorAll(".usa-error-message")).toHaveLength(0);
  });
});

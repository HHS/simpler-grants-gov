// @vitest-environment jsdom
import type { ControlProps } from "@jsonforms/core";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { AttachmentReferenceControl } from "./AttachmentReferenceControl";

const first = "00000000-0000-4000-8000-000000000001";
const second = "00000000-0000-4000-8000-000000000002";
const props = (changes: Partial<ControlProps> = {}) =>
  ({
    data: [first, second],
    path: "attachments",
    label: "Files",
    description: "In order",
    required: true,
    enabled: true,
    schema: {
      type: "array",
      minItems: 1,
      maxItems: 100,
      items: { type: "string", format: "uuid" },
    },
    ...changes,
  }) as ControlProps;
afterEach(cleanup);

describe("library attachment references", () => {
  it("does not publish native input on mount or sample replacement", () => {
    let inputs = 0;
    const view = render(
      <form onInput={() => inputs++}>
        <AttachmentReferenceControl key="first" {...props()} />
      </form>,
    );
    expect(inputs).toBe(0);
    view.rerender(
      <form onInput={() => inputs++}>
        <AttachmentReferenceControl
          key="sample"
          {...props({ data: [second] })}
        />
      </form>,
    );
    expect(inputs).toBe(0);
    expect(
      (screen.getByLabelText("File 1 reference") as HTMLInputElement).value,
    ).toBe(second);
    expect(screen.queryByLabelText("File 2 reference")).toBeNull();
  });
  it("publishes committed reorder/removal/edits through native form names", () => {
    let saved: [string, FormDataEntryValue][] = [];
    render(
      <form
        onInput={(e) => {
          saved = [...new FormData(e.currentTarget).entries()];
        }}
      >
        <AttachmentReferenceControl {...props()} />
      </form>,
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Move file 2 reference up" }),
    );
    expect(saved).toEqual([
      ["attachments[0]", second],
      ["attachments[1]", first],
    ]);
    fireEvent.click(
      screen.getByRole("button", { name: "Remove file 1 reference" }),
    );
    expect(saved).toEqual([["attachments[0]", first]]);
    fireEvent.change(screen.getByLabelText("File 1 reference"), {
      target: { value: "invalid-id" },
    });
    expect(saved).toEqual([["attachments[0]", "invalid-id"]]);
    fireEvent.click(
      screen.getByRole("button", { name: "Remove file 1 reference" }),
    );
    expect(saved).toEqual([]);
  });
  it("adds references only up to the schema maximum", () => {
    render(
      <form>
        <AttachmentReferenceControl
          {...props({ data: [], schema: { type: "array", maxItems: 1 } })}
        />
      </form>,
    );
    const add = screen.getByRole("button", {
      name: "Add file reference",
    }) as HTMLButtonElement;
    expect(add.disabled).toBe(false);
    fireEvent.click(add);
    expect(add.disabled).toBe(true);
    expect(screen.getByLabelText("File 1 reference")).toBeDefined();
  });
  it("preserves nested scalar names and never offers a real upload", () => {
    const { container } = render(
      <form>
        <AttachmentReferenceControl
          {...props({
            path: "people.0.abstract",
            data: first,
            schema: { type: "string", format: "uuid" },
          })}
        />
      </form>,
    );
    const input = screen.getByLabelText("File reference") as HTMLInputElement;
    expect(input.name).toBe("people[0]--abstract");
    expect(input.value).toBe(first);
    expect(container.querySelector('input[type="file"]')).toBeNull();
    expect(screen.getByText(/No file is uploaded/)).toBeDefined();
    expect(
      screen.queryByRole("button", { name: "Add file reference" }),
    ).toBeNull();
  });
  it("honors the renderer's disabled boundary", () => {
    const { container } = render(
      <AttachmentReferenceControl {...props({ enabled: false })} />,
    );
    expect(container.querySelector("fieldset")?.disabled).toBe(true);
    expect(screen.getByLabelText("File 1 reference").matches(":disabled")).toBe(
      true,
    );
  });
});

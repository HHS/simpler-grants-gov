// @vitest-environment jsdom
import { afterEach, expect, it } from "vitest";

import { collectPreviewForm, previewFormData } from "./collectPreviewData";

afterEach(() => document.body.replaceChildren());

it("retains current disabled answers without resurrecting deleted or cleared answers", () => {
  document.body.innerHTML = `<form>
    <input name="project" value="Edited project">
    <fieldset disabled>
      <input type="radio" name="grant--fase_type" value="Strengthening" checked>
      <input type="radio" name="grant--fase_type" value="Seed">
      <input name="workplaces[0]--province" value="Ontario">
      <textarea name="notes">Retained notes</textarea>
      <select name="choices" multiple><option selected>A</option><option selected>B</option></select>
      <input type="button" name="action" value="Never an answer">
    </fieldset>
    <input name="cleared" value="">
  </form>`;
  const form = document.querySelector("form")!;
  expect([...previewFormData(form)]).toEqual([
    ["project", "Edited project"],
    ["cleared", ""],
    ["grant--fase_type", "Strengthening"],
    ["workplaces[0]--province", "Ontario"],
    ["notes", "Retained notes"],
    ["choices", "A"],
    ["choices", "B"],
  ]);
  form.querySelector('[name="notes"]')!.remove();
  form.querySelector('[name="choices"]')!.remove();
  const schema = {
    type: "object",
    properties: {
      project: { type: "string" },
      grant: { type: "object", properties: { fase_type: { type: "string" } } },
      workplaces: {
        type: "array",
        items: { type: "object", properties: { province: { type: "string" } } },
      },
      cleared: { type: "string" },
    },
  } as const;
  expect(
    collectPreviewForm(form, schema, {
      workplaces: [{ province: "Old" }, { province: "Deleted" }],
      cleared: "Old",
    }),
  ).toEqual({
    project: "Edited project",
    grant: { fase_type: "Strengthening" },
    workplaces: [{ province: "Ontario" }],
  });
  form.querySelector('[name="workplaces[0]--province"]')!.remove();
  expect(
    collectPreviewForm(form, schema, { workplaces: [{ province: "Old" }] }),
  ).not.toHaveProperty("workplaces");
});

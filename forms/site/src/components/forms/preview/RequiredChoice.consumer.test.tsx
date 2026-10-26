// @vitest-environment jsdom
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeAll, expect, it, vi } from "vitest";

import { loadFormSpec, type FormSpec } from "../../../lib/formSpec";
import { $previewData } from "../../../stores/formPreview";
import FormPreview from "./FormPreview";

let spec: FormSpec;
const initial = {
  applicant_name: "Independent Harbor Group",
  contact_person: { first_name: "Jordan", last_name: "Rivera" },
  contact_person_title: "Independent director",
};
const message = "Provide at least one: AWARD NUMBER or PROJECT NAME.";
beforeAll(async () => {
  // Resolve build-time filesystem references before any React root schedules browser work.
  vi.stubGlobal("window", undefined);
  try {
    spec = await loadFormSpec("cd511-form");
  } finally {
    vi.unstubAllGlobals();
  }
});
afterEach(async () => {
  await act(async () => {
    cleanup();
    $previewData.set({});
  });
});

it("explains CD's inclusive choice and recovers live without changing answers or hiding unrelated errors", async () => {
  $previewData.set(structuredClone(initial));
  const { container } = render(<FormPreview {...spec} />);
  const field = (name: string) =>
    container.querySelector<HTMLInputElement>(`[name="${name}"]`)!;
  const status = () => screen.getByRole("status").textContent ?? "";
  const edit = async (name: string, value: string) => {
    const element = field(name);
    element.focus();
    await act(async () => {
      fireEvent.input(element, { target: { value } });
    });
    expect(field(name)).toBe(element);
    expect(document.activeElement).toBe(element);
  };
  await act(async () => {
    fireEvent.click(screen.getByRole("button", { name: "Check for errors" }));
  });
  expect(status()).toContain(message);
  expect(status()).not.toContain("Contact Person must match a schema in anyOf");
  expect(status()).not.toContain("AWARD NUMBER is required");
  expect(status()).not.toContain("PROJECT NAME is required");
  expect($previewData.get()).toEqual(initial);

  await edit("award_number", "AW-25");
  await waitFor(() => expect(status()).toContain("No errors found."));
  await edit("project_name", "Project25");
  expect(status()).toContain("No errors found.");
  expect($previewData.get()).toEqual({
    ...initial,
    award_number: "AW-25",
    project_name: "Project25",
  });
  await edit("award_number", "");
  expect(status()).toContain("No errors found.");
  expect($previewData.get()).toEqual({ ...initial, project_name: "Project25" });
  await edit("project_name", "");
  expect(status()).toContain(message);
  expect($previewData.get()).toEqual(initial);

  await edit("contact_person_title", "");
  expect(status()).toContain(message);
  expect(status()).toContain("Title is required");
  await edit("contact_person_title", initial.contact_person_title);
  await edit("contact_person--first_name", "");
  expect(status()).toContain(message);
  expect(status()).toContain("First Name is required");
  expect(status()).not.toContain("must match a schema in anyOf");
  await edit("contact_person--first_name", initial.contact_person.first_name);
  await edit("award_number", "AW-25");
  expect(status()).toContain("No errors found.");
  expect($previewData.get()).toEqual({ ...initial, award_number: "AW-25" });
});

it("retains a choice instruction in the summary even when its first member has no displayed control", async () => {
  $previewData.set({});
  render(
    <FormPreview
      schema={{
        type: "object",
        properties: {
          fax: { type: "string", title: "Fax" },
          phone: { type: "string", title: "Phone" },
        },
        anyOf: [{ required: ["fax"] }, { required: ["phone"] }],
      }}
      uischema={{
        type: "VerticalLayout",
        elements: [{ type: "Control", scope: "#/properties/phone" }],
      }}
    />,
  );
  await act(async () => {
    fireEvent.click(screen.getByRole("button", { name: "Check for errors" }));
  });
  expect(screen.getByRole("status").textContent).toContain(
    "Provide at least one: Fax or Phone.",
  );
  expect($previewData.get()).toEqual({});
});

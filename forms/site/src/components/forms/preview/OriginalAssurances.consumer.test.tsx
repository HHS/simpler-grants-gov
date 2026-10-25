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
import FormDataPanel from "./FormDataPanel";
import FormPreview from "./FormPreview";

const slugs = [
  "assurances-for-non-construction-programs-sf-424b",
  "assurances-for-construction-programs-sf-424d",
];
const specs = new Map<string, FormSpec>();
beforeAll(async () => {
  // Resolve build-time files before any React root can schedule browser work.
  vi.stubGlobal("window", undefined);
  try {
    for (const slug of slugs) specs.set(slug, await loadFormSpec(slug));
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

for (const slug of slugs) {
  it(`${slug}: distinguishes live answers from proposed examples and retains submission context`, async () => {
    const spec = specs.get(slug)!;
    $previewData.set({});
    const { container } = render(
      <>
        <pre>
          {JSON.stringify({ title: "Proposed sample, not the entered answer" })}
        </pre>
        <FormPreview {...spec} />
        <FormDataPanel />
      </>,
    );
    const title = () =>
      container.querySelector<HTMLInputElement>('[name="title"]')!;
    const org = () =>
      container.querySelector<HTMLInputElement>(
        '[name="applicant_organization"]',
      )!;
    const data = () =>
      JSON.parse(screen.getByTestId("live-preview-data").textContent!);
    await act(async () => {
      fireEvent.input(title(), { target: { value: "Manually entered title" } });
      fireEvent.input(org(), {
        target: { value: "Manually entered organization" },
      });
    });
    await waitFor(() =>
      expect(data()).toEqual({
        title: "Manually entered title",
        applicant_organization: "Manually entered organization",
      }),
    );
    expect(container.querySelector("pre")!.textContent).toContain(
      "Proposed sample",
    );
    const examples = (
      spec.schema as typeof spec.schema & {
        examples: Record<string, unknown>[];
      }
    ).examples;
    const completedIndex = examples.findIndex(
      (example) => "signature" in example,
    );
    expect(completedIndex).toBeGreaterThanOrEqual(0);
    await act(async () => {
      fireEvent.change(screen.getByLabelText("Sample case"), {
        target: { value: String(completedIndex) },
      });
    });
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Load sample data" }));
    });
    const completed = structuredClone(data());
    expect(completed.signature).toBeTruthy();
    expect(completed.date_signed).toBe("2026-10-25");
    expect(
      container.querySelector<HTMLInputElement>('[name="signature"]')?.disabled,
    ).toBe(true);
    expect(
      container.querySelector<HTMLInputElement>('[name="date_signed"]')
        ?.disabled,
    ).toBe(true);
    await act(async () => {
      fireEvent.input(title(), { target: { value: "Revised title" } });
    });
    await waitFor(() =>
      expect(data()).toEqual({ ...completed, title: "Revised title" }),
    );
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Clear" }));
    });
    await waitFor(() => expect(data()).toEqual({}));
  });
}

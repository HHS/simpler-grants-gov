// @vitest-environment jsdom
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";

import { loadFormSpec } from "../../../lib/formSpec";
import { $previewData } from "../../../stores/formPreview";
import FormPreview from "./FormPreview";

afterEach(() => {
  cleanup();
  $previewData.set({});
});

it("names a short ACH routing answer, counts its two issues honestly, and recovers without changing data", async () => {
  vi.stubGlobal("window", undefined);
  let spec;
  try {
    spec = await loadFormSpec(
      "ach-vendor-miscellaneous-payment-enrollment-form",
    );
  } finally {
    vi.unstubAllGlobals();
  }
  if (!spec) throw new Error("Actual ACH fixture is missing");
  $previewData.set({});
  render(
    <FormPreview
      schema={spec.schema}
      uischema={spec.uischema}
      example={spec.example}
    />,
  );
  await act(async () => {
    fireEvent.click(screen.getByRole("button", { name: "Load sample data" }));
  });
  const before = structuredClone($previewData.get());
  await act(async () => {
    fireEvent.input(
      screen.getByRole("textbox", {
        name: /Nine-Digit Routing Transit Number/i,
      }),
      {
        target: { value: "12345678" },
      },
    );
    fireEvent.click(screen.getByRole("button", { name: "Check for errors" }));
  });
  await waitFor(() =>
    expect(screen.getByRole("status").textContent).toContain(
      "at least 9 characters",
    ),
  );
  expect(screen.getByRole("status").textContent).toContain(
    "2 issues need attention",
  );
  expect(screen.getByRole("status").textContent).not.toContain("12345678");
  expect(screen.getByRole("status").textContent).toContain(
    "Nine-Digit Routing Transit Number",
  );
  await act(async () => {
    fireEvent.input(
      screen.getByRole("textbox", {
        name: /Nine-Digit Routing Transit Number/i,
      }),
      {
        target: { value: "012345678" },
      },
    );
  });
  await waitFor(() =>
    expect(screen.getByRole("status").textContent).toContain("No errors found"),
  );
  const after = structuredClone($previewData.get());
  const expected = structuredClone(before) as {
    financial_institution: { routing_transit_number: string };
  };
  expected.financial_institution.routing_transit_number = "012345678";
  expect(after).toEqual(expected);
});

// @vitest-environment jsdom
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { useState } from "react";
import { afterEach, expect, it, vi } from "vitest";

import { loadFormSpec, type FormSpec } from "../../../lib/formSpec";
import { SggFormRenderer } from "./SggFormRenderer";

afterEach(cleanup);
async function spec(id: string) {
  vi.stubGlobal("window", undefined);
  try {
    return await loadFormSpec(id);
  } finally {
    vi.unstubAllGlobals();
  }
}
function Preview({ schema, uischema, example }: FormSpec) {
  const [data, setData] = useState<unknown>(example);
  const [warnings, setWarnings] = useState<string[]>([]);
  return (
    <>
      <SggFormRenderer
        schema={schema}
        uischema={uischema}
        data={data}
        showErrors
        onChange={(next, messages) => {
          setData(next);
          setWarnings(messages);
        }}
      />
      <output data-testid="readable-warnings">
        {JSON.stringify(warnings)}
      </output>
      <output data-testid="collected-answer">{JSON.stringify(data)}</output>
    </>
  );
}
it("names the FNS long-answer limit without echoing the answer, then recovers live", async () => {
  render(
    <Preview
      {...await spec(
        "grant-program-accounting-system-financial-capability-questionnaire-fns-906",
      )}
    />,
  );
  const control = screen.getByRole("textbox", {
    name: /Additional information including/i,
  });
  const long = "Private illustrative narrative ".repeat(120);
  await act(async () => {
    fireEvent.input(control, { target: { value: long } });
  });
  await waitFor(() =>
    expect(screen.getByTestId("readable-warnings").textContent).toContain(
      "3000 characters or fewer",
    ),
  );
  expect(screen.getByTestId("readable-warnings").textContent).not.toContain(
    "Private illustrative narrative",
  );
  expect(
    JSON.parse(screen.getByTestId("collected-answer").textContent!)
      .additional_information,
  ).toBe(long);
  await act(async () => {
    fireEvent.input(control, { target: { value: "Corrected narrative" } });
  });
  await waitFor(() =>
    expect(screen.getByTestId("readable-warnings").textContent).toBe("[]"),
  );
});

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

it("names an EPA email error without echoing the answer and preserves the other role", async () => {
  const form = await spec("epa-key-contacts");
  const person = (first: string, email: string) => ({
    name: { first_name: first, last_name: "Contact" },
    address: {
      street1: "10 Example Street",
      city: "Denver",
      state: "CO: Colorado",
      zip_code: "80202",
      country: "USA: UNITED STATES",
    },
    phone: "2025550102",
    email,
  });
  const payee = person("Payee", "payee@example.org");
  const manager = person("Manager", "manager@example.org");
  const { container } = render(
    <Preview {...form} example={{ payee, project_manager: manager }} />,
  );
  const email = container.querySelector<HTMLInputElement>(
    '[name="payee--email"]',
  )!;
  expect(email).not.toBeNull();
  await act(async () => {
    fireEvent.input(email, { target: { value: "distinctive-invalid-answer" } });
  });
  await waitFor(() =>
    expect(screen.getByTestId("readable-warnings").textContent).toContain(
      "Email: Enter a valid email address.",
    ),
  );
  expect(screen.getByTestId("readable-warnings").textContent).not.toContain(
    "distinctive-invalid-answer",
  );
  let answer = JSON.parse(screen.getByTestId("collected-answer").textContent!);
  expect(answer.payee.email).toBe("distinctive-invalid-answer");
  expect(answer.project_manager).toEqual(manager);
  await act(async () => {
    fireEvent.input(email, { target: { value: payee.email } });
  });
  await waitFor(() =>
    expect(screen.getByTestId("readable-warnings").textContent).toBe("[]"),
  );
  answer = JSON.parse(screen.getByTestId("collected-answer").textContent!);
  expect(answer.payee).toEqual(payee);
  expect(answer.project_manager).toEqual(manager);
});

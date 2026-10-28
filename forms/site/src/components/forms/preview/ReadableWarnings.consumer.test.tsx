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
import { afterEach, expect, it } from "vitest";

import { type FormSpec } from "../../../lib/formSpec";
import { SggFormRenderer } from "./SggFormRenderer";

afterEach(cleanup);
function spec(
  property: string,
  rules: Record<string, unknown>,
  title: string,
  value: string,
): FormSpec {
  return {
    schema: {
      type: "object",
      properties: { [property]: { type: "string", title, ...rules } },
    },
    uischema: {
      type: "Control",
      scope: `#/properties/${property}`,
      options: { widget: "Text" },
    },
    example: { [property]: value },
  };
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
it("names a long-answer limit without echoing the answer, then recovers live", async () => {
  render(
    <Preview
      {...spec(
        "additional_information",
        { maxLength: 3000 },
        "Additional information including context",
        "Initial narrative",
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

it("names an email error without echoing the answer and recovers live", async () => {
  render(
    <Preview
      {...spec("email", { format: "email" }, "Email", "jordan@example.org")}
    />,
  );
  const email = screen.getByRole("textbox", { name: "Email" });
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
  expect(
    JSON.parse(screen.getByTestId("collected-answer").textContent!).email,
  ).toBe("distinctive-invalid-answer");
  await act(async () => {
    fireEvent.input(email, { target: { value: "jordan@example.org" } });
  });
  await waitFor(() =>
    expect(screen.getByTestId("readable-warnings").textContent).toBe("[]"),
  );
});

it("uses field instructions for the word limit instead of exposing its regex", async () => {
  render(
    <Preview
      {...spec(
        "support",
        {
          pattern: "^(?:\\S+\\s+){0,299}\\S+\\s*$",
          description: "Use a 300-word limit for this response.",
        },
        "Project support for Opportunity Zones",
        "Within the limit",
      )}
    />,
  );
  const control = screen.getByRole("textbox", {
    name: /Project support for Opportunity Zones/i,
  });
  await act(async () => {
    fireEvent.input(control, {
      target: { value: Array(301).fill("a").join(" ") },
    });
  });
  await waitFor(() =>
    expect(screen.getByTestId("readable-warnings").textContent).toContain(
      "300-word limit",
    ),
  );
  expect(screen.getByTestId("readable-warnings").textContent).not.toContain(
    "must match pattern",
  );
  expect(screen.getByTestId("readable-warnings").textContent).not.toContain(
    "\\S+",
  );
  await act(async () => {
    fireEvent.input(control, { target: { value: "Within the limit" } });
  });
  await waitFor(() =>
    expect(screen.getByTestId("readable-warnings").textContent).toBe("[]"),
  );
});

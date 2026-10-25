// @vitest-environment jsdom
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import { useState } from "react";
import { afterEach, expect, it, vi } from "vitest";

import { loadFormSpec, type FormSpec } from "../../../lib/formSpec";
import { SggFormRenderer } from "./SggFormRenderer";

// Observe the boundary passed to the child renderer. Validation, warning placement,
// fallback and native FormData collection still use the actual preview implementation.
// AttachmentReferenceControl does not itself display inline errors.
vi.mock("../../../vendor/sgg/JsonFormsFields", () => ({
  JsonFormsFields: ({
    errors,
    formData,
  }: {
    errors: unknown;
    formData: Record<string, unknown>;
  }) => (
    <>
      <input
        aria-label="Research strategy reference"
        name="research_strategy"
        defaultValue={formData.research_strategy as string}
      />
      <input
        aria-label="Letters of support reference"
        name="letters_of_support"
        defaultValue={formData.letters_of_support as string}
      />
      <input
        aria-label="Appendix reference"
        name="appendix[0]"
        defaultValue={(formData.appendix as string[])[0]}
      />
      <output data-testid="child-warnings">{JSON.stringify(errors)}</output>
    </>
  ),
}));

afterEach(cleanup);

const strategyId = "00000000-0000-4000-8000-000000000001";
const supportId = "00000000-0000-4000-8000-000000000002";
const appendixId = "00000000-0000-4000-8000-000000000003";

function Preview({ schema, uischema }: FormSpec) {
  const [data, setData] = useState<unknown>({
    research_strategy: strategyId,
    letters_of_support: supportId,
    appendix: [appendixId],
  });
  const [warnings, setWarnings] = useState<string[]>([]);
  return (
    <>
      <SggFormRenderer
        schema={schema}
        uischema={uischema}
        data={data}
        showErrors
        onChange={(next, nextWarnings) => {
          setData(next);
          setWarnings(nextWarnings);
        }}
      />
      <output data-testid="answer-data">{JSON.stringify(data)}</output>
      <output data-testid="summary-warnings">{JSON.stringify(warnings)}</output>
    </>
  );
}

it("refreshes warnings on edits without remounting inputs and retains unplaced UUID warnings", async () => {
  // The build-time loader resolves filesystem refs in Node. Hide jsdom's window
  // during loading so the ref parser does not prefix those paths with localhost.
  vi.stubGlobal("window", undefined);
  let spec: FormSpec;
  try {
    spec = await loadFormSpec("phs-398-research-plan");
  } finally {
    vi.unstubAllGlobals();
  }
  render(<Preview {...spec} />);
  const strategy = screen.getByLabelText("Research strategy reference");
  const support = screen.getByLabelText("Letters of support reference");
  const appendix = screen.getByLabelText("Appendix reference");
  const childWarnings = () =>
    JSON.parse(screen.getByTestId("child-warnings").textContent ?? "null");
  const answerData = () =>
    JSON.parse(screen.getByTestId("answer-data").textContent ?? "null");

  expect(childWarnings()).toEqual([]);
  appendix.focus();
  await act(async () =>
    fireEvent.input(appendix, { target: { value: "not-a-uuid" } }),
  );
  // The frontend formatter cannot place this scalar-array warning. The preview's
  // completeWarnings fallback must deliver it to both the child and live summary.
  expect(childWarnings()).toContainEqual(
    expect.objectContaining({ field: "$.appendix[0]", type: "format" }),
  );
  expect(screen.getByTestId("summary-warnings").textContent).toContain(
    "$.appendix[0]",
  );
  expect(screen.getByLabelText("Appendix reference")).toBe(appendix);
  expect(document.activeElement).toBe(appendix);

  await act(async () =>
    fireEvent.input(appendix, { target: { value: appendixId } }),
  );
  expect(childWarnings()).toEqual([]);
  strategy.focus();
  await act(async () => fireEvent.input(strategy, { target: { value: "" } }));
  expect(childWarnings()).toContainEqual(
    expect.objectContaining({ field: "$.research_strategy", type: "required" }),
  );
  await act(async () =>
    fireEvent.input(strategy, { target: { value: strategyId } }),
  );
  expect(childWarnings()).toEqual([]);
  expect(screen.getByTestId("summary-warnings").textContent).toBe("[]");
  expect(screen.getByLabelText("Research strategy reference")).toBe(strategy);
  expect(screen.getByLabelText("Letters of support reference")).toBe(support);
  expect(document.activeElement).toBe(strategy);
  expect(answerData()).toEqual({
    research_strategy: strategyId,
    letters_of_support: supportId,
    appendix: [appendixId],
  });
});

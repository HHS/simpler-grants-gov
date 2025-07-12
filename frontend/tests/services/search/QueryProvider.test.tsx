import userEvent from "@testing-library/user-event";
import QueryProvider, { QueryContext } from "src/services/search/QueryProvider";
import { QueryContextParams } from "src/types/search/searchQueryTypes";
import { render, screen } from "tests/react-utils";

import React, { useContext } from "react";

type ContextHandlers = {
  onContextUpdate: (context: QueryContextParams) => void;
  onContextDisplay: (context: QueryContextParams) => React.ReactNode;
};

// Generic child component for displaying + updating the context object held by QueryProvider
function ChildWithHandlers(props: ContextHandlers) {
  const context = useContext(QueryContext);
  return (
    <React.Fragment>
      <button onClick={() => props.onContextUpdate(context)}>
        UPDATE CONTEXT
      </button>
      {props.onContextDisplay(context)}
    </React.Fragment>
  );
}

// Util function to simplify the process for rendering components + updating the context by clicking the button
async function updateAndDisplayQueryContext(props: ContextHandlers) {
  render(
    <QueryProvider>
      <ChildWithHandlers
        onContextUpdate={props.onContextUpdate}
        onContextDisplay={props.onContextDisplay}
      />
    </QueryProvider>,
  );

  // We need to wait until AFTER the first render is complete to update the context object or else
  // React will throw a "Cannot update a component from inside the function body of a different component" warning when
  // QueryProvider's setState() get invoked while ChildWithHandlers is rendering
  const updateButton = screen.getByRole("button");
  await userEvent.click(updateButton);
}

const defaultQueryTerm = "defaultQueryTerm";
const mockSearchParams = new URLSearchParams(defaultQueryTerm);
mockSearchParams.set("query", defaultQueryTerm);
jest.mock("next/navigation", () => ({
  useSearchParams: () => mockSearchParams,
}));

describe("QueryProvider", () => {
  it("queryTerm is set to the correct default based-on useSearchParams()", async () => {
    await updateAndDisplayQueryContext({
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      onContextUpdate: (_: QueryContextParams) => {},
      onContextDisplay: (context: QueryContextParams) => context.queryTerm,
    });
    const content = screen.getByText(defaultQueryTerm);
    expect(content).toBeInTheDocument();
  });

  it("queryTerm updates when updateQueryTerm() is called in a child component", async () => {
    const expectedText = "testQueryTerm";
    await updateAndDisplayQueryContext({
      onContextUpdate: (context: QueryContextParams) =>
        context.updateQueryTerm(expectedText),
      onContextDisplay: (context: QueryContextParams) => context.queryTerm,
    });
    const content = screen.getByText(expectedText);
    expect(content).toBeInTheDocument();
  });
  it("totalPages updates when updateTotalPages() is called in a child component", async () => {
    const expectedText = "testTotalPages";
    await updateAndDisplayQueryContext({
      onContextUpdate: (context: QueryContextParams) =>
        context.updateTotalPages(expectedText),
      onContextDisplay: (context: QueryContextParams) => context.totalPages,
    });
    const content = screen.getByText(expectedText);
    expect(content).toBeInTheDocument();
  });
  it("totalResults updates when updateTotalResults() is called in a child component", async () => {
    const expectedText = "testTotalResults";
    await updateAndDisplayQueryContext({
      onContextUpdate: (context: QueryContextParams) =>
        context.updateTotalResults(expectedText),
      onContextDisplay: (context: QueryContextParams) => context.totalResults,
    });
    const content = screen.getByText(expectedText);
    expect(content).toBeInTheDocument();
  });
  it("localAndOrParam updates when updateLocalAndOrParam() is called in a child component", async () => {
    const expectedText = "testLocalAndOrParam";
    await updateAndDisplayQueryContext({
      onContextUpdate: (context: QueryContextParams) =>
        context.updateLocalAndOrParam(expectedText),
      onContextDisplay: (context: QueryContextParams) =>
        context.localAndOrParam,
    });
    const content = screen.getByText(expectedText);
    expect(content).toBeInTheDocument();
  });
});

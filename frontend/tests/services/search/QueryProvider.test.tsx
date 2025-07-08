import QueryProvider, { QueryContext } from "src/services/search/QueryProvider";
import { QueryContextParams } from "src/types/search/searchQueryTypes";
import { render, screen } from "tests/react-utils";

import { useContext } from "react";

type contextHandlers = {
  onContextUpdate: (context: QueryContextParams) => void;
  onContextDisplay: (context: QueryContextParams) => React.ReactNode;
};

// Generic child component that creates a context object, updates it and displays dynamic content based-on its current state
function ChildWithHandlers(props: contextHandlers) {
  const context = useContext(QueryContext);
  props.onContextUpdate(context);
  return props.onContextDisplay(context);
}

function renderQueryProviderWithHandlers(props: contextHandlers) {
  render(
    <QueryProvider>
      <ChildWithHandlers
        onContextUpdate={props.onContextUpdate}
        onContextDisplay={props.onContextDisplay}
      />
    </QueryProvider>,
  );
}

describe("QueryProvider", () => {
  it("queryTerm updates when updateQueryTerm() is called in a child component", () => {
    const expectedText = "testQueryTerm";
    renderQueryProviderWithHandlers({
      onContextUpdate: (context: QueryContextParams) =>
        context.updateQueryTerm(expectedText),
      onContextDisplay: (context: QueryContextParams) => context.queryTerm,
    });

    const content = screen.getByText(expectedText);
    expect(content).toBeInTheDocument();
  });
  it("totalPages updates when updateTotalPages() is called in a child component", () => {
    const expectedText = "testTotalPages";
    renderQueryProviderWithHandlers({
      onContextUpdate: (context: QueryContextParams) =>
        context.updateTotalPages(expectedText),
      onContextDisplay: (context: QueryContextParams) => context.totalPages,
    });
    const content = screen.getByText(expectedText);
    expect(content).toBeInTheDocument();
  });
  it("totalResults updates when updateTotalResults() is called in a child component", () => {
    const expectedText = "testTotalResults";
    renderQueryProviderWithHandlers({
      onContextUpdate: (context: QueryContextParams) =>
        context.updateTotalResults(expectedText),
      onContextDisplay: (context: QueryContextParams) => context.totalResults,
    });
    const content = screen.getByText(expectedText);
    expect(content).toBeInTheDocument();
  });
  it("localAndOrParam updates when updateLocalAndOrParam() is called in a child component", () => {
    const expectedText = "testLocalAndOrParam";
    renderQueryProviderWithHandlers({
      onContextUpdate: (context: QueryContextParams) =>
        context.updateLocalAndOrParam(expectedText),
      onContextDisplay: (context: QueryContextParams) =>
        context.localAndOrParam,
    });
    const content = screen.getByText(expectedText);
    expect(content).toBeInTheDocument();
  });
});

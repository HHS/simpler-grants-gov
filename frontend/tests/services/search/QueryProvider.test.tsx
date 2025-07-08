import QueryProvider, { QueryContext } from "src/services/search/QueryProvider";
import { QueryContextParams } from "src/types/search/searchQueryTypes";
import { render, screen } from "tests/react-utils";

import { useContext } from "react";

type contextHandlers = {
  setter: (context: QueryContextParams) => void;
  display: (context: QueryContextParams) => React.ReactNode;
};

// Generic child component that creates a context object, updates it and displays dynamic content based-on its current state
function ChildWithHandlers(props: contextHandlers) {
  const context = useContext(QueryContext);
  props.setter(context);
  return props.display(context);
}

function renderQueryProviderWithHandlers(props: contextHandlers) {
  render(
    <QueryProvider>
      <ChildWithHandlers setter={props.setter} display={props.display} />
    </QueryProvider>,
  );
}

describe("QueryProvider", () => {
  it("queryTerm updates when updateQueryTerm() is called in a child component", () => {
    const expectedText = "testQueryTerm";
    renderQueryProviderWithHandlers({
      setter: (context: QueryContextParams) => {
        context.updateQueryTerm(expectedText);
      },
      display: (context: QueryContextParams) => {
        return context.queryTerm;
      },
    });

    const content = screen.getByText(expectedText);
    expect(content).toBeInTheDocument();
  });
  it("totalPages updates when updateTotalPages() is called in a child component", () => {
    const expectedText = "testTotalPages";
    renderQueryProviderWithHandlers({
      setter: (context: QueryContextParams) => {
        context.updateTotalPages(expectedText);
      },
      display: (context: QueryContextParams) => {
        return context.totalPages;
      },
    });
    const content = screen.getByText(expectedText);
    expect(content).toBeInTheDocument();
  });
  it("totalResults updates when updateTotalResults() is called in a child component", () => {
    const expectedText = "testTotalResults";
    renderQueryProviderWithHandlers({
      setter: (context: QueryContextParams) => {
        context.updateTotalResults(expectedText);
      },
      display: (context: QueryContextParams) => {
        return context.totalResults;
      },
    });
    const content = screen.getByText(expectedText);
    expect(content).toBeInTheDocument();
  });
  it("localAndOrParam updates when updateLocalAndOrParam() is called in a child component", () => {
    const expectedText = "testLocalAndOrParam";
    renderQueryProviderWithHandlers({
      setter: (context: QueryContextParams) => {
        context.updateLocalAndOrParam(expectedText);
      },
      display: (context: QueryContextParams) => {
        return context.localAndOrParam;
      },
    });
    const content = screen.getByText(expectedText);
    expect(content).toBeInTheDocument();
  });
});

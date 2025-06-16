import { QueryContext } from "src/services/search/QueryProvider";

export const mockUpdateTotalPages = jest.fn();
export const mockUpdateTotalResults = jest.fn();
export const mockUpdateLocalAndOrParam = jest.fn();
export const mockUpdateQueryTerm = jest.fn();

export const FakeQueryProvider = ({
  children,
  localAndOrParam = "",
  totalResults = "",
  queryTerm = "",
  totalPages = "1",
}: {
  children: React.ReactNode;
  localAndOrParam?: string;
  totalResults?: string;
  queryTerm?: string;
  totalPages?: string;
}) => {
  const contextValue = {
    updateTotalPages: mockUpdateTotalPages,
    updateTotalResults: mockUpdateTotalResults,
    totalPages,
    queryTerm,
    // eslint-disable-next-line
    updateQueryTerm: mockUpdateQueryTerm,
    totalResults,
    updateLocalAndOrParam: mockUpdateLocalAndOrParam,
    localAndOrParam,
  };
  return (
    <QueryContext.Provider value={contextValue}>
      {children}
    </QueryContext.Provider>
  );
};

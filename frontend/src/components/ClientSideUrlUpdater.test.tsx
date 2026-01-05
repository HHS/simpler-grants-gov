import { render } from "@testing-library/react";

import { ClientSideUrlUpdater } from "src/components/ClientSideUrlUpdater";

const mockUpdateQueryParams = jest.fn();
const mockPush = jest.fn();
const mockGetSearchParam = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: (url: unknown): unknown => mockPush(url),
  }),
}));

jest.mock("src/hooks/useSearchParamUpdater", () => ({
  useSearchParamUpdater: () => ({
    updateQueryParams: mockUpdateQueryParams,
    searchParams: {
      get: mockGetSearchParam,
    },
  }),
}));

describe("ClientSideUrlUpdater", () => {
  it("updates the full url if url is provided", () => {
    render(<ClientSideUrlUpdater url="new url" />);
    expect(mockPush).toHaveBeenCalledWith("new url");
  });

  it("updates param with passed value when provided", () => {
    render(<ClientSideUrlUpdater param="any" value="thing" />);
    expect(mockUpdateQueryParams).toHaveBeenCalledWith(
      "thing",
      "any",
      undefined,
    );
  });

  it("updates query when provided", () => {
    render(<ClientSideUrlUpdater query="new query" value="" param="query" />);
    expect(mockUpdateQueryParams).toHaveBeenCalledWith(
      "",
      "query",
      "new query",
    );
  });

  it("uses current query if not provided", () => {
    mockGetSearchParam.mockReturnValue("current query");
    render(<ClientSideUrlUpdater param="any" value="thing" />);
    expect(mockUpdateQueryParams).toHaveBeenCalledWith(
      "thing",
      "any",
      "current query",
    );
  });
});

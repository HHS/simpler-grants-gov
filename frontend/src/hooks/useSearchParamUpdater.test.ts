import { renderHook, waitFor } from "@testing-library/react";
import { useSearchParamUpdater } from "src/hooks/useSearchParamUpdater";

let mockSearchParams = new URLSearchParams();
const mockPush = jest.fn();
const mockQueryParamsToQueryString = jest.fn();

jest.mock("next/navigation", () => ({
  usePathname: () => "/test",
  useRouter: () => ({
    push: mockPush,
  }),
  useSearchParams: () => mockSearchParams,
}));

jest.mock("src/utils/generalUtils", () => ({
  queryParamsToQueryString: (...args: unknown[]) =>
    mockQueryParamsToQueryString(...args) as unknown,
}));

// tldr; this is here to work around with some testing environment issues, rather
// than anything specfically related to this test.
// long version; the original function only works in jest node envs
// and there is a reference to `document` somewhere in the import tree
// so using the node env doesn't work either. Reimplemented without reference to
// `params.size` since that seems to be what JSDom doesn't like
jest.mock("src/utils/search/searchUtils", () => ({
  paramsToFormattedQuery: (params: URLSearchParams) =>
    `?${decodeURIComponent(params.toString())}`,
}));

describe("useSearchParamUpdater", () => {
  beforeEach(() => {
    mockSearchParams = new URLSearchParams();
    mockPush.mockResolvedValue(true);
    mockQueryParamsToQueryString.mockReturnValue("?hi=there");
  });
  afterEach(() => {
    jest.resetAllMocks();
  });
  describe("updateQueryParams", () => {
    it("updates a singular param and pushes new path", async () => {
      const { result } = renderHook(() => useSearchParamUpdater());

      result.current.updateQueryParams("", "query", "testQuery");

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith("/test?query=testQuery", {
          scroll: false,
        });
      });
    });

    it("updates multiple params and pushes new path", async () => {
      const { result } = renderHook(() => useSearchParamUpdater());
      const statuses = new Set(["forecasted", "posted"]);

      result.current.updateQueryParams(statuses, "status", "test", true);

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith(
          "/test?status=forecasted,posted&query=test",
          { scroll: true },
        );
      });
    });

    it("clears the status param when no statuses are selected", async () => {
      const { result } = renderHook(() => useSearchParamUpdater());
      const statuses: Set<string> = new Set();

      result.current.updateQueryParams(statuses, "status", "test");

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith("/test?query=test", {
          scroll: false,
        });
      });
    });
  });
  describe("replaceQueryParams", () => {
    it("calls push with new params", () => {
      const { result } = renderHook(() => useSearchParamUpdater());
      const fakeQueryParams = {
        status: "Archived",
        fundingInstrument: "Grant",
        eligibility: "Individual",
      };

      result.current.replaceQueryParams(fakeQueryParams);

      expect(mockQueryParamsToQueryString).toHaveBeenCalledWith(
        fakeQueryParams,
      );
      expect(mockPush).toHaveBeenCalledWith("/test?hi=there");
    });
  });
  describe("removeQueryParam", () => {
    it("calls push with new params with specified param removed", () => {
      mockSearchParams = new URLSearchParams("keepMe=cool&removeMe=uncool");
      const { result } = renderHook(() => useSearchParamUpdater());
      result.current.removeQueryParam("removeMe");
      expect(mockPush).toHaveBeenCalledWith("/test?keepMe=cool", {
        scroll: false,
      });
    });
  });

  describe("clearQueryParams", () => {
    it("clears all query params if no argument is passed", () => {
      mockSearchParams = new URLSearchParams("keepMe=cool&removeMe=uncool");
      const { result } = renderHook(() => useSearchParamUpdater());
      result.current.clearQueryParams();
      expect(mockPush).toHaveBeenCalledWith("/test?");
    });
    it("clears selected query params based on passed argument", () => {
      mockSearchParams = new URLSearchParams("keepMe=cool&removeMe=uncool");
      const { result } = renderHook(() => useSearchParamUpdater());
      result.current.clearQueryParams(["removeMe"]);
      expect(mockPush).toHaveBeenCalledWith("/test?keepMe=cool");
    });
  });

  // UNCOMMENT ME AFTER MERGING https://github.com/HHS/simpler-grants-gov/pull/5380

  // describe("removeQueryParamValue", () => {
  //   it("does not call push if there is no value to update and no default value to use", () => {
  //     mockSearchParams = new URLSearchParams("");
  //     const { result } = renderHook(() => useSearchParamUpdater());
  //     result.current.removeQueryParamValue("agency", "DOC");
  //     expect(routerPush).not.toHaveBeenCalled();
  //   });
  //   it("calls push to remove value set in defaults if no param is present in URL", () => {
  //     mockSearchParams = new URLSearchParams("");
  //     const { result } = renderHook(() => useSearchParamUpdater());
  //     result.current.removeQueryParamValue("status", "forecasted");
  //     expect(routerPush).toHaveBeenCalledWith("/test?status=posted", {
  //       scroll: false,
  //     });
  //   });
  //   it("calls push to reset to defaults if removing value would result in empty query and defaults available", () => {
  //     mockSearchParams = new URLSearchParams("/test?status=close");
  //     const { result } = renderHook(() => useSearchParamUpdater());
  //     result.current.removeQueryParamValue("status", "closed");
  //     expect(routerPush).toHaveBeenCalledWith(
  //       "/test?status=posted,forecasted",
  //       { scroll: false },
  //     );
  //   });
  //   it("calls push to remove specified query param value", () => {
  //     mockSearchParams = new URLSearchParams("/test?agency=any,somethingElse");
  //     const { result } = renderHook(() => useSearchParamUpdater());
  //     result.current.removeQueryParamValue("agency", "any");
  //     expect(routerPush).toHaveBeenCalledWith("/test?agency=somethingElse", {
  //       scroll: false,
  //     });
  //   });
  // });
  describe("setQueryParam", () => {
    it("sets a query param", () => {
      mockSearchParams = new URLSearchParams("keepMe=cool&removeMe=uncool");
      const { result } = renderHook(() => useSearchParamUpdater());
      result.current.setQueryParam("keepMe", "updated");
      expect(mockPush).toHaveBeenCalledWith(
        "/test?keepMe=updated&removeMe=uncool",
        { scroll: false },
      );
    });
  });
  describe("setQueryParams", () => {
    it("sets multiple query params", () => {
      mockSearchParams = new URLSearchParams("query=cool&agency=uncool");
      const { result } = renderHook(() => useSearchParamUpdater());
      result.current.setQueryParams({
        query: "updated",
        agency: "alsoUpdated",
      });
      expect(mockPush).toHaveBeenCalledWith(
        "/test?query=updated&agency=alsoUpdated",
        { scroll: false },
      );
    });
  });
});

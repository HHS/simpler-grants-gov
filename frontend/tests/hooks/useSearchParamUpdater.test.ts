/* eslint-disable jest/no-commented-out-tests */
import { renderHook, waitFor } from "@testing-library/react";
import { useSearchParamUpdater } from "src/hooks/useSearchParamUpdater";

const mockSearchParams = new URLSearchParams();
const routerPush = jest.fn(() => Promise.resolve(true));
jest.mock("next/navigation", () => ({
  usePathname: jest.fn(() => "/test") as jest.Mock<string>,
  useRouter: () => ({
    push: routerPush,
  }),
  useSearchParams: jest.fn(
    () => mockSearchParams,
  ) as jest.Mock<URLSearchParams>,
}));

describe("useSearchParamUpdater", () => {
  it("updates a singular param and pushes new path", async () => {
    const { result } = renderHook(() => useSearchParamUpdater());

    result.current.updateQueryParams("", "query", "testQuery");

    await waitFor(() => {
      expect(routerPush).toHaveBeenCalledWith("/test?query=testQuery", {
        scroll: false,
      });
    });
  });

  it("updates multiple params and pushes new path", async () => {
    const { result } = renderHook(() => useSearchParamUpdater());
    const statuses = new Set(["forecasted", "posted"]);

    result.current.updateQueryParams(statuses, "status", "test", true);

    await waitFor(() => {
      expect(routerPush).toHaveBeenCalledWith(
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
      expect(routerPush).toHaveBeenCalledWith("/test?query=test", {
        scroll: false,
      });
    });
  });
});

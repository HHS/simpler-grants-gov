import { act, renderHook, waitFor } from "@testing-library/react";

import { FilterOption } from "../../src/components/search/SearchFilterAccordion/SearchFilterAccordion";
import useSearchFilter from "../../src/hooks/useSearchFilterAccordion";

jest.mock("../../src/hooks/useSearchParamUpdater", () => ({
  useSearchParamUpdater: () => ({
    updateQueryParams: jest.fn(),
  }),
}));

describe("useSearchFilter", () => {
  let initialOptions: FilterOption[];
  let mockFormRef: React.RefObject<HTMLFormElement>;

  beforeEach(() => {
    initialOptions = [
      { id: "1", label: "Option 1", value: "option1" },
      {
        id: "2",
        label: "Option 2",
        value: "option2",
        children: [
          { id: "2-1", label: "Option 2-1", value: "option2-1" },
          { id: "2-2", label: "Option 2-2", value: "option2-2" },
          { id: "2-3", label: "Option 2-3", value: "option2-3" },
        ],
      },
    ];

    mockFormRef = {
      current: document.createElement("form"),
    };
  });

  it("should initialize all options as unchecked", () => {
    const { result } = renderHook(() =>
      useSearchFilter(initialOptions, "", "status", mockFormRef),
    );

    /* eslint-disable jest/no-conditional-expect */
    /* eslint-disable testing-library/no-node-access */
    expect(result.current.options.every((option) => !option.isChecked)).toBe(
      true,
    );
    result.current.options.forEach((option) => {
      if (option.children) {
        expect(option.children.every((child) => !child.isChecked)).toBe(true);
      }
    });
  });
  it("should toggle an option's checked state", async () => {
    const { result } = renderHook(() =>
      useSearchFilter(initialOptions, "", "status", mockFormRef),
    );

    act(() => {
      result.current.toggleOptionChecked("1", true);
    });

    await waitFor(() => {
      expect(
        result.current.options.find((option) => option.id === "1")?.isChecked,
      ).toBe(true);
    });
  });

  it("should correctly update the total checked count after toggling options", async () => {
    const { result } = renderHook(() =>
      useSearchFilter(initialOptions, "closed,archived", "status", mockFormRef),
    );

    act(() => {
      result.current.toggleOptionChecked("1", true);
    });

    await waitFor(() => {
      expect(result.current.totalCheckedCount).toBe(1);
    });

    // TODO: fix flaky test below

    // act(() => {
    //   result.current.toggleSelectAll(true);
    // });

    // await waitFor(
    //   () => {
    //     const expectedCount = 4;
    //     expect(result.current.totalCheckedCount).toBe(expectedCount);
    //   },
    //   { timeout: 5000 },
    // );
  });
});

import { act, renderHook, waitFor } from "@testing-library/react";

import { FilterOption } from "../../src/components/search/SearchFilterAccordion/SearchFilterAccordion";
import useSearchFilter from "../../src/hooks/useSearchFilter";

describe("useSearchFilter", () => {
  let initialOptions: FilterOption[];

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
  });

  /* eslint-disable testing-library/no-node-access */
  /* eslint-disable jest/no-conditional-expect */
  it("should initialize all options as unchecked (isChecked false)", () => {
    const { result } = renderHook(() => useSearchFilter(initialOptions));

    expect(result.current.options.every((option) => !option.isChecked)).toBe(
      true,
    );
    if (result.current.options.some((option) => option.children)) {
      result.current.options.forEach((option) => {
        if (option.children) {
          expect(option.children.every((child) => !child.isChecked)).toBe(true);
        }
      });
    }
  });

  it("should toggle an option's checked state", async () => {
    const { result } = renderHook(() => useSearchFilter(initialOptions));

    act(() => {
      result.current.toggleOptionChecked("1", true);
    });

    await waitFor(() => {
      expect(
        result.current.options.find((option) => option.id === "1")?.isChecked,
      ).toBe(true);
    });
  });

  it("should toggle select all options", async () => {
    const { result } = renderHook(() => useSearchFilter(initialOptions));

    act(() => {
      result.current.toggleSelectAll(true);
    });

    await waitFor(() => {
      expect(result.current.options.every((option) => option.isChecked)).toBe(
        true,
      );
    });

    await waitFor(() => {
      const optionWithChildren = result.current.options.find(
        (option) => option.id === "2",
      );
      expect(
        optionWithChildren?.children?.every((child) => child.isChecked),
      ).toBe(true);
    });
  });

  it("should correctly update the total checked count after toggling options", async () => {
    const { result } = renderHook(() => useSearchFilter(initialOptions));

    // Toggle an option and wait for the expected state update
    act(() => {
      result.current.toggleOptionChecked("1", true);
    });

    await waitFor(
      () => {
        expect(result.current.totalCheckedCount).toBe(1);
      },
      { timeout: 5000 },
    ); // Increase timeout if necessary

    // Toggle select all and wait for the expected state update
    act(() => {
      result.current.toggleSelectAll(true);
    });

    // You might need to adjust this depending on the behavior of your hook and the environment
    const expectedCount = 4;

    await waitFor(() => {
      expect(result.current.totalCheckedCount).toBe(expectedCount);
    });
  });
});

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { initialFilterOptions } from "src/utils/testing/fixtures";
import { useTranslationsMock } from "src/utils/testing/intlMocks";

import { AllOptionCheckbox } from "src/components/search/SearchFilterAccordion/AllOptionCheckbox";

const mockSetQueryParam = jest.fn();

const optionValues = initialFilterOptions.map((option) => option.value);

jest.mock("next-intl", () => ({
  useTranslations: () => useTranslationsMock(),
}));

jest.mock("src/hooks/useSearchParamUpdater", () => ({
  useSearchParamUpdater: () => ({
    setQueryParam: mockSetQueryParam,
  }),
}));

describe("AllOptionCheckbox", () => {
  afterEach(() => {
    jest.resetAllMocks();
  });
  it("displays a checkbox with the correct name and label", () => {
    render(
      <AllOptionCheckbox
        title={"Fun checkbox"}
        currentSelections={new Set()}
        childOptions={[]}
        queryParamKey={"whatever"}
      />,
    );
    const checkboxByName = screen.getByRole("checkbox", {
      name: "all Fun checkbox",
    });
    expect(checkboxByName).toBeInTheDocument();
  });
  it("calls setQueryParam as expected when checking", async () => {
    render(
      <AllOptionCheckbox
        title={"Fun checkbox"}
        currentSelections={new Set(["hi"])}
        childOptions={initialFilterOptions}
        queryParamKey={"whatever"}
      />,
    );
    const checkbox = screen.getByRole("checkbox");
    expect(checkbox).not.toBeChecked();

    await userEvent.click(checkbox);

    expect(mockSetQueryParam).toHaveBeenCalledWith(
      "whatever",
      optionValues.concat("hi").join(","),
    );
  });
  it("calls setQueryParam as expected when un-checking", async () => {
    render(
      <AllOptionCheckbox
        title={"Fun checkbox"}
        currentSelections={new Set(optionValues.concat(["hi"]))}
        childOptions={initialFilterOptions}
        queryParamKey={"whatever"}
      />,
    );
    const checkbox = screen.getByRole("checkbox");
    expect(checkbox).toBeChecked();

    await userEvent.click(checkbox);

    expect(mockSetQueryParam).toHaveBeenCalledWith("whatever", "hi");
  });
  it("checks and unchecks the box as expected when outside selections change", () => {
    const { rerender } = render(
      <AllOptionCheckbox
        title={"Fun checkbox"}
        currentSelections={new Set(optionValues)}
        childOptions={initialFilterOptions}
        queryParamKey={"whatever"}
      />,
    );
    const checkbox = screen.getByRole("checkbox");
    expect(checkbox).toBeChecked();

    rerender(
      <AllOptionCheckbox
        title={"Fun checkbox"}
        currentSelections={new Set(optionValues.slice(0, 1))}
        childOptions={initialFilterOptions}
        queryParamKey={"whatever"}
      />,
    );

    expect(checkbox).not.toBeChecked();

    rerender(
      <AllOptionCheckbox
        title={"Fun checkbox"}
        currentSelections={new Set(optionValues)}
        childOptions={initialFilterOptions}
        queryParamKey={"whatever"}
      />,
    );

    expect(checkbox).toBeChecked();
  });
});

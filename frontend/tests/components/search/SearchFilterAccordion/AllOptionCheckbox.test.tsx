import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  filterOptionsWithChildren,
  initialFilterOptions,
} from "src/utils/testing/fixtures";
import { useTranslationsMock } from "src/utils/testing/intlMocks";

import { AllOptionCheckbox } from "src/components/search/SearchFilterAccordion/AllOptionCheckbox";

const mockSetQueryParam = jest.fn();
const mockSetQueryParams = jest.fn();

const optionValues = initialFilterOptions.map((option) => option.value);

jest.mock("next-intl", () => ({
  useTranslations: () => useTranslationsMock(),
}));

jest.mock("src/hooks/useSearchParamUpdater", () => ({
  useSearchParamUpdater: () => ({
    setQueryParam: mockSetQueryParam,
    setQueryParams: mockSetQueryParams,
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
        queryParamKey={"agency"}
      />,
    );
    const checkboxByName = screen.getByRole("checkbox", {
      name: "all Fun checkbox",
    });
    expect(checkboxByName).toBeInTheDocument();
  });
  describe("non-top-level scenarios", () => {
    it("calls setQueryParam as expected when checking", async () => {
      render(
        <AllOptionCheckbox
          title={"Fun checkbox"}
          currentSelections={new Set(["hi"])}
          childOptions={initialFilterOptions}
          queryParamKey={"agency"}
        />,
      );
      const checkbox = screen.getByRole("checkbox");
      expect(checkbox).not.toBeChecked();

      await userEvent.click(checkbox);

      expect(mockSetQueryParam).toHaveBeenCalledWith(
        "agency",
        optionValues.concat("hi").join(","),
      );
    });
    it("calls setQueryParam as expected when un-checking", async () => {
      render(
        <AllOptionCheckbox
          title={"Fun checkbox"}
          currentSelections={new Set(optionValues.concat(["hi"]))}
          childOptions={initialFilterOptions}
          queryParamKey={"agency"}
        />,
      );
      const checkbox = screen.getByRole("checkbox");
      expect(checkbox).toBeChecked();

      await userEvent.click(checkbox);

      expect(mockSetQueryParam).toHaveBeenCalledWith("agency", "hi");
    });
    it("checks and unchecks the box as expected when outside selections change", () => {
      const { rerender } = render(
        <AllOptionCheckbox
          title={"Fun checkbox"}
          currentSelections={new Set(optionValues)}
          childOptions={initialFilterOptions}
          queryParamKey={"agency"}
        />,
      );
      const checkbox = screen.getByRole("checkbox");
      expect(checkbox).toBeChecked();

      rerender(
        <AllOptionCheckbox
          title={"Fun checkbox"}
          currentSelections={new Set(optionValues.slice(0, 1))}
          childOptions={initialFilterOptions}
          queryParamKey={"agency"}
        />,
      );

      expect(checkbox).not.toBeChecked();

      rerender(
        <AllOptionCheckbox
          title={"Fun checkbox"}
          currentSelections={new Set(optionValues)}
          childOptions={initialFilterOptions}
          queryParamKey={"agency"}
        />,
      );

      expect(checkbox).toBeChecked();
    });
  });
  describe("top-level scenarios", () => {
    it("checks box if top level params indicate", () => {
      render(
        <AllOptionCheckbox
          title={"Fun checkbox"}
          currentSelections={new Set([""])}
          childOptions={initialFilterOptions}
          queryParamKey="agency"
          topLevelQuery={new Set(["something"])}
          topLevelQueryParamKey="topLevelAgency"
          topLevelQueryValue="something"
        />,
      );
      const checkbox = screen.getByRole("checkbox");
      expect(checkbox).toBeChecked();
    });
    it("checks the box if top level becomes selected", () => {
      const { rerender } = render(
        <AllOptionCheckbox
          title={"Fun checkbox"}
          currentSelections={new Set([""])}
          childOptions={initialFilterOptions}
          queryParamKey="agency"
          topLevelQuery={new Set([])}
          topLevelQueryParamKey="topLevelAgency"
          topLevelQueryValue="something"
        />,
      );
      const checkbox = screen.getByRole("checkbox");
      expect(checkbox).not.toBeChecked();

      rerender(
        <AllOptionCheckbox
          title={"Fun checkbox"}
          currentSelections={new Set(optionValues)}
          childOptions={initialFilterOptions}
          queryParamKey="agency"
          topLevelQuery={new Set(["something"])}
          topLevelQueryParamKey="topLevelAgency"
          topLevelQueryValue="something"
        />,
      );
      expect(checkbox).toBeChecked();
    });
    it("responds correctly to check", async () => {
      // eslint-disable-next-line
      const children = filterOptionsWithChildren[0]?.children || [];
      render(
        <AllOptionCheckbox
          title={"Fun checkbox"}
          currentSelections={new Set(["hello", "AGNC-KID"])}
          childOptions={children}
          queryParamKey="agency"
          topLevelQuery={new Set(["anything"])}
          topLevelQueryParamKey="topLevelAgency"
          topLevelQueryValue="something"
        />,
      );
      const checkbox = screen.getByRole("checkbox");
      expect(checkbox).not.toBeChecked();

      await userEvent.click(checkbox);
      expect(mockSetQueryParams).toHaveBeenCalledWith({
        topLevelAgency: "anything,something",
        agency: "hello",
      });
    });
    it("responds correctly to un-check", async () => {
      // eslint-disable-next-line
      const children = filterOptionsWithChildren[0]?.children || [];
      render(
        <AllOptionCheckbox
          title={"Fun checkbox"}
          currentSelections={new Set(["hello", "AGNC-KID"])}
          childOptions={children}
          queryParamKey="agency"
          topLevelQuery={new Set(["anything", "AGNC"])}
          topLevelQueryParamKey="topLevelAgency"
          topLevelQueryValue="AGNC"
        />,
      );
      const checkbox = screen.getByRole("checkbox");
      expect(checkbox).toBeChecked();

      await userEvent.click(checkbox);
      expect(mockSetQueryParams).toHaveBeenCalledWith({
        topLevelAgency: "anything",
        agency: "hello",
      });
    });
  });
});

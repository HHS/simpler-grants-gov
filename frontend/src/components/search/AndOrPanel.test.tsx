import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  FakeQueryProvider,
  mockUpdateLocalAndOrParam,
} from "src/utils/testing/providerMocks";

import { AndOrPanel } from "src/components/search/AndOrPanel";

const mockSetQueryParam = jest.fn();

jest.mock("src/hooks/useSearchParamUpdater", () => ({
  useSearchParamUpdater: () => ({
    setQueryParam: mockSetQueryParam,
  }),
}));

describe("AndOrPanel", () => {
  afterEach(() => jest.resetAllMocks());
  it("if hasSearchTerm, runs both setQueryParam and updateLocalAndOrParam on toggle", async () => {
    render(
      <FakeQueryProvider>
        <AndOrPanel hasSearchTerm={true} />
      </FakeQueryProvider>,
    );

    const radio = screen.getByRole("radio", {
      name: "May include any words (ex. transportation OR safety)",
    });
    await userEvent.click(radio);
    expect(mockUpdateLocalAndOrParam).toHaveBeenCalledWith("OR");
    expect(mockSetQueryParam).toHaveBeenCalledWith("andOr", "OR");
  });
  it("if !hasSearchTerm, runs only updateLocalAndOrParam on toggle", async () => {
    render(
      <FakeQueryProvider>
        <AndOrPanel hasSearchTerm={false} />
      </FakeQueryProvider>,
    );

    const radio = screen.getByRole("radio", {
      name: "May include any words (ex. transportation OR safety)",
    });
    await userEvent.click(radio);
    expect(mockUpdateLocalAndOrParam).toHaveBeenCalledWith("OR");
    expect(mockSetQueryParam).not.toHaveBeenCalled();
  });
  it("if !localAndOrParam, defaults checked to `AND`", () => {
    render(
      <FakeQueryProvider localAndOrParam="">
        <AndOrPanel hasSearchTerm={false} />
      </FakeQueryProvider>,
    );

    const radioOr = screen.getByRole("radio", {
      name: "May include any words (ex. transportation OR safety)",
    });
    const radioAnd = screen.getByRole("radio", {
      name: "Must include all words (ex. transportation AND safety)",
    });

    expect(radioOr).not.toBeChecked();
    expect(radioAnd).toBeChecked();
  });
  it("if localAndOrParam, sets checked to value of localAndOrParam", () => {
    const { rerender } = render(
      <FakeQueryProvider localAndOrParam="OR">
        <AndOrPanel hasSearchTerm={false} />
      </FakeQueryProvider>,
    );

    const radioOr = screen.getByRole("radio", {
      name: "May include any words (ex. transportation OR safety)",
    });
    const radioAnd = screen.getByRole("radio", {
      name: "Must include all words (ex. transportation AND safety)",
    });

    expect(radioOr).toBeChecked();
    expect(radioAnd).not.toBeChecked();

    rerender(
      <FakeQueryProvider localAndOrParam="AND">
        <AndOrPanel hasSearchTerm={false} />
      </FakeQueryProvider>,
    );

    expect(radioOr).not.toBeChecked();
    expect(radioAnd).toBeChecked();
  });
});

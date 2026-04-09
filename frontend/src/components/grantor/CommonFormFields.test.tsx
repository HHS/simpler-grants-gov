import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import {
  CommonCharacterCount,
  CommonSelectInput,
  CommonTextArea,
  CommonTextInput,
} from "./CommonFormFields";

const dynamicFieldLabelProps = {
  labelId: "label-for-something",
  labelText: "Label for Something",
  description: "Enter something",
  fieldId: "someId",
  isRequired: false,
};

// --- Test Common Input ---
let textValue = "";
const onOppNbrChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  textValue = e.target.value;
};
const commonInputProps = {
  ...dynamicFieldLabelProps,
  fieldMaxLength: 40,
  defaultValue: textValue,
  onTextChange: onOppNbrChange,
};
describe("CommonTextInput", () => {
  it("Renders the element with maxLength", () => {
    render(<CommonTextInput {...commonInputProps} />);
    const element = screen.getByRole("textbox", {
      name: "Label for Something",
    });
    expect(element).toBeInTheDocument();
    expect(element).toHaveAttribute("maxLength", "40");
    expect(element).toHaveValue("");
  });
  it("Renders the element with a default value", () => {
    commonInputProps.defaultValue = "Prefilled text";
    render(<CommonTextInput {...commonInputProps} />);
    const element = screen.getByRole("textbox", {
      name: "Label for Something",
    });
    expect(element).toBeInTheDocument();
    expect(element).toHaveAttribute("maxLength", "40");
    expect(element).toHaveValue("Prefilled text");
  });
  it("Renders the element and handle onChange", () => {
    render(<CommonTextInput {...commonInputProps} />);
    const element = screen.getByRole("textbox", {
      name: "Label for Something",
    });
    expect(element).toBeInTheDocument();
    // Simulate a change event and test if our variable changed
    fireEvent.change(element, { target: { value: "Hello World" } });
    expect(textValue).toBe("Hello World");
  });
});

// --- Test Common Textarea ---
let bigTextValue = "";
const onTextAreaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
  bigTextValue = e.target.value;
};
const commonTextAreaProps = {
  ...dynamicFieldLabelProps,
  fieldMaxLength: 40,
  defaultValue: textValue,
  onTextChange: onTextAreaChange,
};
describe("CommonTextArea", () => {
  it("Renders the element with maxLength", () => {
    commonTextAreaProps.defaultValue = ""; // clear the text from reused props
    render(<CommonTextArea {...commonTextAreaProps} />);
    const element = screen.getByRole("textbox", {
      name: "Label for Something",
    });
    expect(element).toBeInTheDocument();
    expect(element).toHaveAttribute("maxLength", "40");
    expect(element).toHaveValue("");
  });
  it("Renders the element with a default value", () => {
    commonTextAreaProps.defaultValue = "Prefilled text 2";
    render(<CommonTextArea {...commonTextAreaProps} />);
    const element = screen.getByRole("textbox", {
      name: "Label for Something",
    });
    expect(element).toBeInTheDocument();
    expect(element).toHaveValue("Prefilled text 2");
  });
  it("Renders the element and handle onChange", () => {
    render(<CommonTextArea {...commonTextAreaProps} />);
    const element = screen.getByRole("textbox", {
      name: "Label for Something",
    });
    expect(element).toBeInTheDocument();
    // Simulate a change event and test if our variable changed
    fireEvent.change(element, { target: { value: "Hello World 2" } });
    expect(bigTextValue).toBe("Hello World 2");
  });
});

// --- Test Common CharacterCount ---
const mockOnChangeCharCnt = jest.fn();
const commonCharacterCountProps = {
  ...dynamicFieldLabelProps,
  fieldMaxLength: 40,
  defaultValue: "",
  onTextChange: mockOnChangeCharCnt,
  isTextArea: false,
};
describe("CommonCharacterCount", () => {
  it("Renders the element with maxLength", () => {
    render(<CommonCharacterCount {...commonCharacterCountProps} />);
    const element = screen.getByRole("textbox", {
      name: "Label for Something",
    });
    expect(element).toBeInTheDocument();
    expect(element).toHaveValue("");
    const charCountText = screen.getByText("40 characters allowed");
    expect(charCountText).toBeInTheDocument();
  });
  it("Renders the element with a default value", () => {
    commonCharacterCountProps.defaultValue = "Prefilled text 2";
    render(<CommonCharacterCount {...commonCharacterCountProps} />);
    const element = screen.getByRole("textbox", {
      name: "Label for Something",
    });
    expect(element).toBeInTheDocument();
    expect(element).toHaveValue("Prefilled text 2");
    const charCountText = screen.getByText("24 characters left");
    expect(charCountText).toBeInTheDocument();
    expect(element instanceof HTMLInputElement).toBe(true);
    expect(element instanceof HTMLTextAreaElement).not.toBe(true);
  });
  it("Renders the element as a textarea", () => {
    commonCharacterCountProps.isTextArea = true;
    render(<CommonCharacterCount {...commonCharacterCountProps} />);
    const element = screen.getByRole("textbox", {
      name: "Label for Something",
    });
    expect(element).toBeInTheDocument();
    expect(element instanceof HTMLInputElement).not.toBe(true);
    expect(element instanceof HTMLTextAreaElement).toBe(true);
  });
  it("Renders the element and handle onChange", () => {
    render(<CommonCharacterCount {...commonCharacterCountProps} />);
    const element = screen.getByRole("textbox", {
      name: "Label for Something",
    });
    expect(element).toBeInTheDocument();
    // Simulate a change event and test if our variable changed
    fireEvent.change(element, {
      target: { value: "12345678901234567890123456789012345678901234567890" },
    });
    expect(mockOnChangeCharCnt).toHaveBeenCalledTimes(1);
    expect(mockOnChangeCharCnt).toHaveBeenCalledWith(expect.any(Object));
    // Validate the character count message
    const charCountText = screen.getByText("10 characters over limit");
    expect(charCountText).toBeInTheDocument();
  });
});

// --- Test Common Select ---
const fakeId = "456-XYZ";
const fakeAgencies = {
  "123-ABC": "Agency Alpha",
  "456-XYZ": "Agency Beta",
};
let selectedValue = "";
const onSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
  selectedValue = e.target.value;
};
const commonSelectProps = {
  ...dynamicFieldLabelProps,
  listKeyValuePairs: fakeAgencies,
  onSelectionChange: onSelectChange,
};
describe("CommonSelectInput", () => {
  it("Renders the element with a list of options", () => {
    render(<CommonSelectInput {...commonSelectProps} />);
    expect(
      screen.getByRole("option", { name: "Agency Alpha" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("option", { name: "Agency Beta" }),
    ).toBeInTheDocument();
  });
  it("Renders the element with a default selection", () => {
    const extendedProps = {
      ...commonSelectProps,
      defaultSelection: fakeId,
    };
    render(<CommonSelectInput {...extendedProps} />);
    const selectedOption = screen.getByRole("option", {
      name: "Agency Beta",
      selected: true,
    });
    expect(selectedOption).toBeInTheDocument();
  });
  it("Renders the element with a a custom 'please select' text", () => {
    const myText = "Please select an agency";
    const extendedProps = {
      ...commonSelectProps,
      pleaseSelectText: myText,
    };
    render(<CommonSelectInput {...extendedProps} />);
    const element = screen.getByRole("option", { name: myText });
    expect(element).toBeInTheDocument();
    expect(element).toHaveValue("");
  });
  it("Renders the element and handle onSelectionChange", async () => {
    const extendedProps = {
      ...commonSelectProps,
      defaultSelection: "456-XYZ",
    };
    render(<CommonSelectInput {...extendedProps} />);
    const selectedOption = screen.getByRole("option", {
      name: "Agency Beta",
      selected: true,
    });
    expect(selectedOption).toBeInTheDocument();

    // Simulate a user selecting an option
    const element = screen.getByRole("combobox", {
      name: "Label for Something",
    });
    await userEvent.selectOptions(element, "Agency Alpha");
    const newSelectedOption = screen.getByRole("option", {
      name: "Agency Alpha",
      selected: true,
    });
    expect(newSelectedOption).toBeInTheDocument();
    expect(selectedValue).toBe("123-ABC");
  });
});

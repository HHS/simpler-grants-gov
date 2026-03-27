import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import {
  CommonLabel,
  CommonSelectInput,
  CommonText,
  CommonTextArea,
  CommonTextInput,
} from "./CommonFormFields";

// --- Test Common Text ---
const commonTextProps = {
  textContent: "Some text here.",
};
describe("CommonText", () => {
  it("Renders the element", () => {
    render(<CommonText {...commonTextProps} />);
    expect(screen.getByText(commonTextProps.textContent)).toBeInTheDocument();
  });
});

// --- Test Common Label ---
const commonLabelProps = {
  labelId: "label-for-something",
  labelText: "Label for Something",
  description: "Enter something",
  fieldId: "someId",
  isRequired: false,
};
describe("CommonLabel", () => {
  it("Renders the element", () => {
    render(<CommonLabel {...commonLabelProps} />);
    expect(screen.getByText(commonLabelProps.labelText)).toBeInTheDocument();
    expect(screen.getByText(commonLabelProps.description)).toBeInTheDocument();
  });
  it("Renders with isRequired", () => {
    commonLabelProps.isRequired = true;
    render(<CommonLabel {...commonLabelProps} />);
    const spanElement = screen.getByText("*");
    expect(spanElement).toBeInTheDocument();
    expect(spanElement).toHaveClass("text-red");
  });
  it("Renders with error message", () => {
    const extendedProps = {
      ...commonLabelProps,
      validationError: "some error",
    };
    render(<CommonLabel {...extendedProps} />);
    const spanElement = screen.getByText("some error");
    expect(spanElement).toBeInTheDocument();
    expect(spanElement).toHaveClass("usa-error-message");
  });
});

// --- Test Common Input ---
let textValue = "";
const onOppNbrChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  textValue = e.target.value;
};
const commonInputProps = {
  ...commonLabelProps,
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
    expect(element).toHaveValue("");
    const charCountText = screen.getByText("40 characters allowed");
    expect(charCountText).toBeInTheDocument();
  });
  it("Renders the element with a default value", () => {
    commonInputProps.defaultValue = "Prefilled text";
    render(<CommonTextInput {...commonInputProps} />);
    const element = screen.getByRole("textbox", {
      name: "Label for Something",
    });
    expect(element).toBeInTheDocument();
    expect(element).toHaveValue("Prefilled text");
    const charCountText = screen.getByText("26 characters left");
    expect(charCountText).toBeInTheDocument();
  });
  it("Renders the element and handle onChange", () => {
    render(<CommonTextInput {...commonInputProps} />);
    const element = screen.getByRole("textbox", {
      name: "Label for Something",
    });
    expect(element).toBeInTheDocument();
    // Simulate a change event and test if our variable changed
    fireEvent.change(element, {
      target: { value: "12345678901234567890123456789012345678901234567890" },
    });
    expect(textValue).toBe(
      "12345678901234567890123456789012345678901234567890",
    );
    // Validate the character count message
    const charCountText = screen.getByText("10 characters over limit");
    expect(charCountText).toBeInTheDocument();
  });
});

// --- Test Common Textarea ---
let bigTextValue = "";
const onTextAreaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
  bigTextValue = e.target.value;
};
const commonTextAreaProps = {
  ...commonLabelProps,
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
    expect(element).toHaveValue("");
    const charCountText = screen.getByText("40 characters allowed");
    expect(charCountText).toBeInTheDocument();
  });
  it("Renders the element with a default value", () => {
    commonTextAreaProps.defaultValue = "Prefilled text 2";
    render(<CommonTextArea {...commonTextAreaProps} />);
    const element = screen.getByRole("textbox", {
      name: "Label for Something",
    });
    expect(element).toBeInTheDocument();
    expect(element).toHaveValue("Prefilled text 2");
    const charCountText = screen.getByText("24 characters left");
    expect(charCountText).toBeInTheDocument();
  });
  it("Renders the element and handle onChange", () => {
    render(<CommonTextArea {...commonTextAreaProps} />);
    const element = screen.getByRole("textbox", {
      name: "Label for Something",
    });
    expect(element).toBeInTheDocument();
    // Simulate a change event and test if our variable changed
    fireEvent.change(element, {
      target: { value: "12345678901234567890123456789012345678901234567890" },
    });
    expect(bigTextValue).toBe(
      "12345678901234567890123456789012345678901234567890",
    );
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
  ...commonLabelProps,
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

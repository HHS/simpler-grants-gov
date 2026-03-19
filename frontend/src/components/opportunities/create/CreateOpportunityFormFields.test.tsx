import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from '@testing-library/user-event';

import {
  CommonText,
  CommonLabel,
  CommonTextArea,
  CommonTextInput,
  CommonSelectInput,
  KeyValuePair,
} from "./CreateOpportunityFormFields";

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
    expect(document.getElementById("label-for-something")).toBeInTheDocument();
    expect(screen.getByText(commonLabelProps.labelText)).toBeInTheDocument();
    expect(screen.getByText(commonLabelProps.description)).toBeInTheDocument();
  });
  it("Renders with isRequired", () => {
    commonLabelProps.isRequired = true;
    render(<CommonLabel {...commonLabelProps} />);
    const spanElement = screen.getByText('*');
    expect(spanElement).toBeInTheDocument();
    expect(spanElement).toHaveClass('text-red');
  });
  it("Renders with error message", () => {
    const extendedProps = {
        ...commonLabelProps,
        validationError: "some error",
    }
    render(<CommonLabel {...extendedProps} />);
    const spanElement = screen.getByText('some error');
    expect(spanElement).toBeInTheDocument();
    expect(spanElement).toHaveClass('usa-error-message');
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
    const element = document.getElementById("someId");
    expect(element).toBeInTheDocument();
    expect(element).toHaveAttribute('maxLength', '40');
    expect(element).toHaveValue('');
  });
  it("Renders the element with a default value", () => {
    commonInputProps.defaultValue = "Prefilled text";
    render(<CommonTextInput {...commonInputProps} />);
    const element = document.getElementById("someId");
    expect(element).toBeInTheDocument();
    expect(element).toHaveAttribute('maxLength', '40');
    expect(element).toHaveValue('Prefilled text');
  });
  it("Renders the element and handle onChange", () => {
    render(<CommonTextInput {...commonInputProps} />);
    const element = document.getElementById("someId") as HTMLOptionElement;
    expect(element).toBeInTheDocument();
    // Simulate a change event and test if our variable changed
    fireEvent.change(element, { target: { value: 'Hello World' } });
    expect(element.value).toBe('Hello World');
    expect(textValue).toBe('Hello World');
  });
});  


// --- Test Common Textarea ---
describe("CommonTextArea", () => {
  it("Renders the element with maxLength", () => {
    commonInputProps.defaultValue = "";     // clear the text from reused props
    render(<CommonTextArea {...commonInputProps} />);
    const element = document.getElementById("someId");
    expect(element).toBeInTheDocument();
    expect(element).toHaveAttribute('maxLength', '40');
    expect(element).toHaveValue('');
  });
  it("Renders the element with a default value", () => {
    commonInputProps.defaultValue = "Prefilled text 2";
    render(<CommonTextArea {...commonInputProps} />);
    const element = document.getElementById("someId");
    expect(element).toBeInTheDocument();
    expect(element).toHaveAttribute('maxLength', '40');
    expect(element).toHaveValue('Prefilled text 2');
  });
  it("Renders the element and handle onChange", () => {
    render(<CommonTextArea {...commonInputProps} />);
    const element = document.getElementById("someId") as HTMLOptionElement;
    expect(element).toBeInTheDocument();
    // Simulate a change event and test if our variable changed
    fireEvent.change(element, { target: { value: 'Hello World 2' } });
    expect(element.value).toBe('Hello World 2');
    expect(textValue).toBe('Hello World 2');
  });
});  


// --- Test Common Select ---
const fakeId = "456-XYZ";
const fakeAgencies: KeyValuePair[] = [
    { key: '123-ABC', value: 'Agency Alpha' },
    { key: '456-XYZ', value: 'Agency Beta' },
    ];
//const mockOnSelectionChange = jest.fn();
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
    expect( screen.getByRole('option', { name: 'Agency Alpha' }) ).toBeInTheDocument();
    expect( screen.getByRole('option', { name: 'Agency Beta' }) ).toBeInTheDocument();
  });
  it("Renders the element with a default selection", () => {
    const extendedProps = {
        ...commonSelectProps,
        defaultSelection: fakeId,
    }
    render(<CommonSelectInput {...extendedProps} />);
    // Find the option element with the name/text matching the default agency id
    const defaultOption = screen.getByRole('option', { name: 'Agency Beta' }) as HTMLOptionElement;
    // Assert that the 'selected' property of this option is true
    expect(defaultOption.selected).toBe(true);
  });
  it("Renders the element with a a custom 'please select' text", () => {
    const myText = "Please select an agency";
    const extendedProps = {
        ...commonSelectProps,
        pleaseSelectText: myText,
    }
    render(<CommonSelectInput {...extendedProps} />);
    const element = screen.getByRole('option', { name: myText }) as HTMLOptionElement;
    expect(element).toBeInTheDocument();
    expect(element.value).toBe('');
  });
  it("Renders the element and handle onSelectionChange", async () => {
    const extendedProps = {
        ...commonSelectProps,
        defaultSelection: "456-XYZ",
    }
    render(<CommonSelectInput {...extendedProps} />);
    const element = document.getElementById("someId") as HTMLOptionElement;
    expect(element).toBeInTheDocument();
    expect(element.value).toBe('456-XYZ');  // Agency Beta
    // Simulate a user selecting an option
    await userEvent.selectOptions(element, 'Agency Alpha');
    expect(element.value).toBe('123-ABC');
    expect(selectedValue).toBe('123-ABC');
  });
});  

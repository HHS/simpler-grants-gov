import { RJSFSchema } from "@rjsf/utils";
import { render, screen } from "@testing-library/react";

import ApplyForm from "src/components/applyForm/ApplyForm";
import { UiSchema } from "src/components/applyForm/types";

const mockSubmitApplyForm = jest.fn();

jest.mock("src/components/applyForm/actions", () => ({
  submitApplyForm: (...args: unknown[]): unknown =>
    mockSubmitApplyForm(...args),
}));

const formSchema: RJSFSchema = {
  title: "test schema",
  properties: {
    name: { type: "string", title: "test name", maxLength: 60 },
    dob: { type: "string", format: "date", title: "Date of birth" },
    address: { type: "string", title: "test address" },
    state: { type: "string", title: "test state" },
  },
  required: ["name"],
};

const uiSchema: UiSchema = [
  {
    type: "section",
    label: "Applicant info",
    name: "ApplicantInfo",
    children: [
      {
        type: "field",
        definition: "/properties/name",
      },
      {
        type: "field",
        definition: "/properties/dob",
      },
    ],
  },
  {
    type: "section",
    label: "Applicant location",
    name: "ApplicantLocation",
    children: [
      {
        type: "field",
        definition: "/properties/address",
      },
      {
        type: "field",
        definition: "/properties/state",
      },
    ],
  },
];

describe("ApplyForm", () => {
  it("renders form correctly", () => {
    render(
      <ApplyForm formSchema={formSchema} uiSchema={uiSchema} formId="test" />,
    );

    const nameLabel = screen.getByText("test name");
    expect(nameLabel).toBeInTheDocument();
    expect(nameLabel).toHaveAttribute("for", "name");

    const nameField = screen.getByTestId("name");
    expect(nameField).toBeInTheDocument();
    expect(nameField).toBeRequired();
    expect(nameField).toHaveAttribute("type", "text");
    expect(nameField).toHaveAttribute("maxLength", "60");
    expect(nameField).toHaveAttribute("name", "name");

    const dobLabel = screen.getByText("Date of birth");
    expect(dobLabel).toBeInTheDocument();
    expect(dobLabel).toHaveAttribute("for", "dob");

    const dobField = screen.getByTestId("dob");
    expect(dobField).toBeInTheDocument();
    expect(dobField).not.toBeRequired();
    expect(dobField).toHaveAttribute("type", "date");

    const nav = screen.getByTestId("InPageNavigation");
    expect(nav).toHaveTextContent("On this form");

    const button = screen.getByTestId("apply-form-submit");
    expect(button).toBeInTheDocument();
  });

  it("calls submitApplyForm action on submit", () => {
    mockSubmitApplyForm.mockImplementation(() => Promise.resolve());

    render(
      <ApplyForm formSchema={formSchema} uiSchema={uiSchema} formId="test" />,
    );

    const button = screen.getByTestId("apply-form-submit");
    button.click();

    expect(mockSubmitApplyForm).toHaveBeenCalledWith(
      {
        errorMessage: "",
        formData: new FormData(),
        formId: "test",
        validationErrors: [],
      },

      expect.any(FormData),
    );
  });
});

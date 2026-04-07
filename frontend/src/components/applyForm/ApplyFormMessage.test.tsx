import { render, screen } from "@testing-library/react";
import { useTranslationsMock } from "src/utils/testing/intlMocks";

import { ApplyFormMessage, getWarningLinkText } from "./ApplyFormMessage";
import { FormattedFormValidationWarning } from "./types";

jest.mock("next-intl", () => ({
  useTranslations: () => useTranslationsMock(),
}));

describe("getWarningLinkText", () => {
  it("returns formatted text when there is no row-aware htmlField", () => {
    const warning: FormattedFormValidationWarning = {
      field: "$.demo_text",
      message: "'demo_text' is a required property",
      formatted: "Demo Text is required",
      type: "required",
      value: null,
      htmlField: "demo_text",
      definition: "/properties/demo_text",
    };

    expect(getWarningLinkText(warning)).toBe("Demo Text is required");
  });

  it("falls back to message when formatted is missing", () => {
    const warning: FormattedFormValidationWarning = {
      field: "$.demo_text",
      message: "'demo_text' is a required property",
      type: "required",
      value: null,
      htmlField: "demo_text",
      definition: "/properties/demo_text",
    };

    expect(getWarningLinkText(warning)).toBe(
      "'demo_text' is a required property",
    );
  });

  it("appends FieldList label and entry number for row-aware warnings", () => {
    const warning: FormattedFormValidationWarning = {
      field: "$.contact_people_test[1].first_name",
      message: "'first_name' is a required property",
      formatted: "First Name is required",
      type: "required",
      value: null,
      htmlField: "contact_people_test[1]--first_name",
      definition: "/properties/contact_people_test/items/properties/first_name",
    };

    expect(getWarningLinkText(warning)).toBe(
      "First Name is required (Contact People Test, Entry 2)",
    );
  });

  it("falls back to entry number only when definition is not a FieldList definition", () => {
    const warning: FormattedFormValidationWarning = {
      field: "$.weird_field[2]",
      message: "Something is wrong",
      formatted: "Something is wrong",
      type: "custom",
      value: null,
      htmlField: "weird_field[2]--value",
      definition: "/properties/weird_field",
    };

    expect(getWarningLinkText(warning)).toBe("Something is wrong (Entry 3)");
  });
});

describe("ApplyFormMessage", () => {
  it("renders nothing when saved is false", () => {
    const { container } = render(
      <ApplyFormMessage
        error={false}
        validationWarnings={null}
        saved={false}
      />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it("renders an error alert when error is true", () => {
    render(
      <ApplyFormMessage error={true} validationWarnings={null} saved={true} />,
    );

    expect(screen.getByText("errorTitle")).toBeInTheDocument();
    expect(screen.getByText("errorMessage")).toBeInTheDocument();
  });

  it("renders a success alert when there are no warnings", () => {
    render(
      <ApplyFormMessage error={false} validationWarnings={[]} saved={true} />,
    );

    expect(screen.getByText("savedTitle")).toBeInTheDocument();
    expect(screen.getByText("savedMessage")).toBeInTheDocument();
  });

  it("deduplicates exact duplicate warnings", () => {
    const warnings: FormattedFormValidationWarning[] = [
      {
        field: "$.demo_text",
        message: "'demo_text' is a required property",
        formatted: "Demo Text is required",
        type: "required",
        value: null,
        htmlField: "demo_text",
        definition: "/properties/demo_text",
      },
      {
        field: "$.demo_text",
        message: "'demo_text' is a required property",
        formatted: "Demo Text is required",
        type: "required",
        value: null,
        htmlField: "demo_text",
        definition: "/properties/demo_text",
      },
    ];

    render(
      <ApplyFormMessage
        error={false}
        validationWarnings={warnings}
        saved={true}
      />,
    );

    expect(screen.getAllByRole("link")).toHaveLength(1);
    expect(
      screen.getByRole("link", { name: "Demo Text is required" }),
    ).toHaveAttribute("href", "#demo_text");
  });

  it("preserves distinct row-aware warnings for different rows", () => {
    const warnings: FormattedFormValidationWarning[] = [
      {
        field: "$.contact_people_test[1].first_name",
        message: "'first_name' is a required property",
        formatted: "First Name is required",
        type: "required",
        value: null,
        htmlField: "contact_people_test[1]--first_name",
        definition:
          "/properties/contact_people_test/items/properties/first_name",
      },
      {
        field: "$.contact_people_test[2].first_name",
        message: "'first_name' is a required property",
        formatted: "First Name is required",
        type: "required",
        value: null,
        htmlField: "contact_people_test[2]--first_name",
        definition:
          "/properties/contact_people_test/items/properties/first_name",
      },
    ];

    render(
      <ApplyFormMessage
        error={false}
        validationWarnings={warnings}
        saved={true}
      />,
    );

    expect(screen.getAllByRole("link")).toHaveLength(2);

    expect(
      screen.getByRole("link", {
        name: "First Name is required (Contact People Test, Entry 2)",
      }),
    ).toHaveAttribute("href", "#contact_people_test[1]--first_name");

    expect(
      screen.getByRole("link", {
        name: "First Name is required (Contact People Test, Entry 3)",
      }),
    ).toHaveAttribute("href", "#contact_people_test[2]--first_name");
  });

  it("uses warning.field for budget forms", () => {
    const warnings: FormattedFormValidationWarning[] = [
      {
        field: "budget-section-a-field",
        message: "Budget field is required",
        formatted: "Budget field is required",
        type: "required",
        value: null,
      },
    ];

    render(
      <ApplyFormMessage
        error={false}
        validationWarnings={warnings}
        saved={true}
        isBudgetForm={true}
      />,
    );

    expect(
      screen.getByRole("link", { name: "Budget field is required" }),
    ).toHaveAttribute("href", "#budget-section-a-field");
  });
});

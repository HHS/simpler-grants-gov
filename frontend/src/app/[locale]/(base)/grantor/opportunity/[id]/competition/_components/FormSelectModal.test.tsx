import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { FormType } from "src/types/allFormsResponseTypes";

import { createRef } from "react";
import { ModalRef } from "@trussworks/react-uswds";

import { FormSelectModal } from "./FormSelectModal";

const forms: FormType[] = [
  {
    form_id: "form-1",
    name: "Application for Federal Assistance",
    short_name: "SF_424",
    current_version: {
      legacy_form_version: "2.1",
      major_version: 4,
      minor_version: 0,
    },
  },
  {
    form_id: "form-2",
    name: "Budget Information",
    short_name: "Budget_Form",
    current_version: {
      legacy_form_version: "1.0",
      major_version: 1,
      minor_version: 0,
    },
  },
];

const renderModal = (
  submitRequiredForms = jest.fn(),
  requiredForms = [{ form_id: "form-1", is_required: true }],
) =>
  render(
    <FormSelectModal
      alwaysRequiredForms={{}}
      requiredForms={requiredForms}
      forms={forms}
      formModalRef={createRef<ModalRef>()}
      submitRequiredForms={submitRequiredForms}
    />,
  );

describe("FormSelectModal", () => {
  it("renders each form and its version", () => {
    renderModal();

    expect(screen.getByText("SF")).toBeInTheDocument();
    expect(
      screen.getByText("Application for Federal Assistance"),
    ).toBeInTheDocument();
    expect(screen.getByText("v4.0")).toBeInTheDocument();
    expect(screen.getByText("Budget")).toBeInTheDocument();
  });

  it("shows always-required forms without a selectable checkbox", () => {
    render(
      <FormSelectModal
        alwaysRequiredForms={{ "form-1": true }}
        requiredForms={[{ form_id: "form-1", is_required: true }]}
        forms={forms}
        formModalRef={createRef<ModalRef>()}
        submitRequiredForms={jest.fn()}
      />,
    );

    expect(screen.getByText("requiredStates.always")).toBeInTheDocument();
    expect(screen.getByText("requiredStates.auto")).toBeInTheDocument();
    expect(screen.getAllByRole("checkbox")).toHaveLength(2);
  });

  it("enables required-state radios after selecting a form", async () => {
    const user = userEvent.setup();
    renderModal(jest.fn(), []);

    const checkboxes = screen.getAllByRole("checkbox");
    const formCheckbox = checkboxes[2];
    const requiredRadios = screen.getAllByRole("radio", {
      name: "requiredStates.required",
    });
    const conditionalRadios = screen.getAllByRole("radio", {
      name: "requiredStates.conditional",
    });
    expect(formCheckbox).not.toBeChecked();
    expect(requiredRadios[1]).toBeDisabled();

    await user.click(formCheckbox);

    expect(formCheckbox).toBeChecked();
    expect(requiredRadios[1]).toBeEnabled();
    expect(conditionalRadios[1]).toBeEnabled();
  });

  it("submits the selected form with its required state", async () => {
    const user = userEvent.setup();
    const submitRequiredForms = jest.fn();
    renderModal(submitRequiredForms, []);

    const checkboxes = screen.getAllByRole("checkbox");
    const conditionalRadios = screen.getAllByRole("radio", {
      name: "requiredStates.conditional",
    });
    await user.click(checkboxes[2]);
    await user.click(conditionalRadios[1]);
    await user.click(screen.getByTestId("save-search-button"));

    expect(submitRequiredForms).toHaveBeenCalledWith([
      { form_id: "form-2", is_required: false },
    ]);
  });

  it("selects all forms and clears all optional selections", async () => {
    const user = userEvent.setup();
    renderModal(jest.fn(), []);

    const checkboxes = screen.getAllByRole("checkbox");
    await user.click(checkboxes[0]);
    expect(checkboxes[0]).toBeChecked();
    expect(checkboxes[1]).toBeChecked();
    expect(checkboxes[2]).toBeChecked();

    await user.click(checkboxes[0]);
    expect(checkboxes[0]).not.toBeChecked();
    expect(checkboxes[1]).not.toBeChecked();
    expect(checkboxes[2]).not.toBeChecked();
  });

  it("passes accessibility scan when rendered", async () => {
    const { container } = renderModal();

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});

// This file contains default values and configurations for forms used in end-to-end tests.

export const FORM_DEFAULTS = {
  saveButtonTestId: "apply-form-save",

  // Save alert strings (from the form wrapper's post-save alert)
  formSavedHeading: "Form was saved",
  noErrorsText: "No errors were detected.",
  validationErrorText: "correct the following errors before submitting",
} as const;

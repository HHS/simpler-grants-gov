/**
 * Central map of field types to handler functions.
 * Usage: import { fieldHandlerMap } from "tests/e2e/utils/common/field-handler-dispatcher";
 */

import { checkboxHandler } from "./checkbox-handler";
import { comboBoxInputHandler } from "./combo-box-input-handler";
import { dateHandler } from "./date-field";
import { dropdownHandler } from "./dropdown-handler";
import { emailHandler } from "./email-field";
import { fileHandler } from "./file-handler";
import { radioButtonHandler } from "./radio-button-handler";
import { selectHandler } from "./select-field";
import { textHandler } from "./text-handler";
import { type FieldHandler, type FieldType } from "./types";

export const fieldHandlerMap: Record<FieldType, FieldHandler> = {
  text: textHandler,
  textarea: textHandler,
  email: emailHandler,
  dropdown: dropdownHandler,
  select: selectHandler,
  date: dateHandler,
  file: fileHandler,
  radiobutton: radioButtonHandler,
  checkbox: checkboxHandler,
  "combo-box-input": comboBoxInputHandler,
};

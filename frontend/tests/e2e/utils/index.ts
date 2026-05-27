// index.ts
// Dispatcher for all supported field types and shared helpers.
// Usage: import { fieldHandlerDispatcher, requiresStringData } from '../index';

import { FieldType, FieldHandler } from "./types";
import { dropdownHandler } from "./dropdown-handler";
import { comboBoxInputHandler } from "./combo-box-input-handler";
import { textHandler } from "./text-handler";
import { radioButtonHandler } from "./radio-button-handler";
import { checkboxHandler } from "./checkbox-handler";
import { fileHandler } from "./file-handler";

export const fieldHandlerDispatcher: Record<FieldType, FieldHandler> = {
  text: textHandler,
  dropdown: dropdownHandler,
  file: fileHandler,
  radiobutton: radioButtonHandler,
  checkbox: checkboxHandler,
  "combo-box-input": comboBoxInputHandler,
};

export function requiresStringData(type: FieldType): boolean {
  return ["text", "dropdown", "file", "combo-box-input"].includes(type);
}

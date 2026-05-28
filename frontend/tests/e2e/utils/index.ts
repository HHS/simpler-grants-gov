// index.ts
// Dispatcher for all supported field types and shared helpers.
// Usage: import { fieldHandlerDispatcher, requiresStringData } from '../index';

import { checkboxHandler } from "./checkbox-handler";
import { comboBoxInputHandler } from "./combo-box-input-handler";
import { dropdownHandler } from "./dropdown-handler";
import { fileHandler } from "./file-handler";
import { radioButtonHandler } from "./radio-button-handler";
import { textHandler } from "./text-handler";
import { FieldHandler, FieldType } from "./types";

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

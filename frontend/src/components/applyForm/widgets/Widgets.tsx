import { JSX } from "react";

import { UswdsWidgetProps, WidgetTypes } from "src/components/applyForm/types";
import AttachmentWidget from "./AttachmentUploadWidget";
import Budget424aSectionA from "./budget/Budget424aSectionA";
import Budget424aSectionB from "./budget/Budget424aSectionB";
import Budget424aSectionC from "./budget/Budget424aSectionC";
import Budget424aSectionD from "./budget/Budget424aSectionD";
import Budget424aSectionE from "./budget/Budget424aSectionE";
import Budget424aSectionF from "./budget/Budget424aSectionF";
import CheckboxWidget from "./CheckboxWidget";
import AttachmentArrayWidget from "./MultipleAttachmentUploadWidget";
import MultiSelect from "./MultiSelectWidget";
import PrintAttachmentWidget from "./PrintAttachmentWidget";
import PrintWidget from "./PrintWidget";
import RadioWidget from "./RadioWidget";
import SelectWidget from "./SelectWidget";
import TextAreaWidget from "./TextAreaWidget";
import TextWidget from "./TextWidget";

export const widgetComponents: Record<
  WidgetTypes,
  (widgetProps: UswdsWidgetProps) => JSX.Element
> = {
  Text: (widgetProps: UswdsWidgetProps) => TextWidget(widgetProps),
  TextArea: (widgetProps: UswdsWidgetProps) => TextAreaWidget(widgetProps),
  Radio: (widgetProps: UswdsWidgetProps) => RadioWidget(widgetProps),
  Select: (widgetProps: UswdsWidgetProps) => SelectWidget(widgetProps),
  Checkbox: (widgetProps: UswdsWidgetProps) => CheckboxWidget(widgetProps),
  Print: (widgetProps: UswdsWidgetProps) => PrintWidget(widgetProps),
  PrintAttachment: (widgetProps: UswdsWidgetProps) =>
    PrintAttachmentWidget(widgetProps),
  Attachment: (widgetProps: UswdsWidgetProps) => AttachmentWidget(widgetProps),
  AttachmentArray: (widgetProps: UswdsWidgetProps) =>
    AttachmentArrayWidget(widgetProps),
  Budget424aSectionA: (widgetProps: UswdsWidgetProps) =>
    Budget424aSectionA(widgetProps),
  Budget424aSectionB: (widgetProps: UswdsWidgetProps) =>
    Budget424aSectionB(widgetProps),
  Budget424aSectionC: (widgetProps: UswdsWidgetProps) =>
    Budget424aSectionC(widgetProps),
  Budget424aSectionD: (widgetProps: UswdsWidgetProps) =>
    Budget424aSectionD(widgetProps),
  Budget424aSectionE: (widgetProps: UswdsWidgetProps) =>
    Budget424aSectionE(widgetProps),
  Budget424aSectionF: (widgetProps: UswdsWidgetProps) =>
    Budget424aSectionF(widgetProps),
  MultiSelect: (widgetProps: UswdsWidgetProps) => MultiSelect(widgetProps),
};

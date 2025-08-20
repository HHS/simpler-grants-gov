import { JSX } from "react";

import { UswdsWidgetProps, WidgetTypes } from "src/components/applyForm/types";
import AttachmentWidget from "./AttachmentUploadWidget";
import Budget424aSectionA from "./budget/Budget424aSectionA";
import Budget424aSectionB from "./budget/Budget424aSectionB";
import CheckboxWidget from "./CheckboxWidget";
import AttachmentArrayWidget from "./MultipleAttachmentUploadWidget";
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
  Attachment: (widgetProps: UswdsWidgetProps) => AttachmentWidget(widgetProps),
  AttachmentArray: (widgetProps: UswdsWidgetProps) =>
    AttachmentArrayWidget(widgetProps),
  Budget424aSectionA: (widgetProps: UswdsWidgetProps) =>
    Budget424aSectionA(widgetProps),
  Budget424aSectionB: (widgetProps: UswdsWidgetProps) =>
    Budget424aSectionB(widgetProps),
};

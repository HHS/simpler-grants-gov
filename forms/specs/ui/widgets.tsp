import "simpler-forms";

using SimplerForms;

/** What renders these forms. Not a JSON Schema namespace, so nothing here is emitted as a schema. */
@UI.widgets(Widget)
namespace Rendering;

/**
 * The widgets `@UI.widget` can name: the SGG frontend's `WidgetTypes`
 * (`frontend/src/types/applyForm/types.ts`), plus the form library preview's own.
 */
enum Widget {
  Attachment,
  AttachmentArray,
  Checkbox,
  Text,
  TextArea,
  Radio,
  Select,
  MultiSelect,
  Print,
  PrintAttachment,
  Budget424aSectionA,
  Budget424aSectionB,
  Budget424aSectionC,
  Budget424aSectionD,
  Budget424aSectionE,
  Budget424aSectionF,
  FieldList,
  Table,

  /** A FieldList whose entries each collapse to a read-only list of their answers. Preview only. */
  CollapsibleFieldList,
}

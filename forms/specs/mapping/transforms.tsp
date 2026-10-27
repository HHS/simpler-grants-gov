import "simpler-forms";
import "form-library-xml";

using SimplerForms;

/** The value transformations `@Mapping.transform` can name. */
@Mapping.transforms(Transformation)
namespace Mappings.Transforms;

/**
 * Each member is one transformation, valued with the name the API's
 * `value_transformers.TRANSFORMATION_REGISTRY` implements it under.
 */
enum Transformation {
  /** `true` → `Y: Yes`, `false` → `N: No`, as `globLib:YesNoDataType` spells them. */
  booleanToYesNo: "boolean_to_yes_no",
}

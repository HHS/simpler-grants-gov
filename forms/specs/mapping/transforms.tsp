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

  /** A currency string with exactly two decimal places: `"1"` → `"1.00"`. */
  currencyFormat: "currency_format",

  /** The string in upper, lower or title case: `#{ case_type: "upper" }`. */
  stringCase: "string_case",

  /** The string's first `max_length` characters: `#{ max_length: 60 }`. */
  truncateString: "truncate_string",

  /**
   * A list of strings joined into one, sorted with `#{ sort: true }` so a code combined from
   * checkbox selections doesn't depend on their order.
   */
  joinValues: "join_values",
}

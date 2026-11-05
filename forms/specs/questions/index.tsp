import "@typespec/json-schema";
import "simpler-forms";

import "#catalogue/index.tsp";
import "#ui/widgets.tsp";

using SimplerForms;

/**
 * No base URI is declared. A question's identity is its `@Meta.question.id`; where the
 * artifacts are hosted is a per-consumer decision.
 */
@JsonSchema.jsonSchema
namespace Questions;

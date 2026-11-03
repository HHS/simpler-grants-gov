import "@typespec/json-schema";
import "simpler-forms";

import "#ui/widgets.tsp";

/** Forms are declarations too; hosting base is supplied at build time. */
@JsonSchema.jsonSchema
namespace Forms;

import "simpler-forms";

import "#questions/index.tsp";

using SimplerForms;

namespace Questions.Types;

// `globLib:YesNoDataType`. The answer is a boolean; each XSD model writes it as `Y: Yes` or
// `N: No` with the `booleanToYesNo` transform.
/** Select Yes or No. */
@Meta.question(#{ id: "types/yes-no" })
@UI.label("Yes or No")
@UI.widget(Rendering.Widget.Radio)
scalar YesNo extends boolean;

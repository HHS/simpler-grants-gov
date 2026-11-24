import "simpler-forms";

import "#questions/index.tsp";

using SimplerForms;

namespace Questions.Types;

// `globLib:CongressionalDistrictDataType` allows 1–6 characters with no pattern. The DATs and
// SGG's existing forms ask for a two-character state, a hyphen and a three-character
// district (CA-005, MD-all, US-all, 00-000), so the question requires that format.
/** Enter the congressional district as two state characters, a hyphen and three characters. */
@Meta.question(#{ id: "types/congressional-district" })
@minLength(6)
@maxLength(6)
@pattern("^[A-Z0-9]{2}-[A-Za-z0-9]{3}$")
scalar CongressionalDistrictCode extends string;

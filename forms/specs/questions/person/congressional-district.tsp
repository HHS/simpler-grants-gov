import "simpler-forms";
import "#questions/index.tsp";

using SimplerForms;

namespace Questions.People;

/** Enter the Congressional District as a two-character state abbreviation, a hyphen and a three-digit district number (for example, CA-005). If outside the US, enter 00-000. */
@Meta.question(#{ id: "person/congressional-district" })
@UI.label("Congressional District")
@minLength(1)
@maxLength(6)
scalar PersonCongressionalDistrict extends string;

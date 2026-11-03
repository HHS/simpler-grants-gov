import "simpler-forms";

import "#questions/index.tsp";

using SimplerForms;

namespace Questions.People;

/** Enter the position title. */
@Meta.question(#{ id: "person/title" })
@Meta.tag(Catalogue.Tag.title)
@UI.label("Title")
@minLength(1)
@maxLength(45)
scalar PersonTitle extends string;

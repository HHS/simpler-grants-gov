import "simpler-forms";

import "#questions/index.tsp";
import "#questions/types/address.tsp";

using SimplerForms;

namespace Questions.Organizations;

/** Enter the legal name of the organization. */
@Meta.question(#{ id: "organization/name" })
@Meta.tag(Catalogue.Tag.organization, Catalogue.Tag.name)
@UI.label("Organization Name")
@minLength(1)
@maxLength(60)
scalar OrgName extends string;

/** An organization's address. */
@Meta.question(#{ id: "organization/address" })
@UI.label("Address")
model OrgAddress is Questions.Types.Address;

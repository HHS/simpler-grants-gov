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

/** Enter the name of the department, service, laboratory or equivalent within the organization. */
@Meta.question(#{ id: "organization/department" })
@Meta.tag(Catalogue.Tag.organization)
@UI.label("Department")
@minLength(1)
@maxLength(100)
scalar OrgDepartment extends string;

/** Enter the name of the division, office or major subdivision within the organization. */
@Meta.question(#{ id: "organization/division" })
@Meta.tag(Catalogue.Tag.organization)
@UI.label("Division")
@minLength(1)
@maxLength(100)
scalar OrgDivision extends string;

/** Enter the organization's Unique Entity Identifier (UEI) from SAM.gov. */
@Meta.question(#{ id: "organization/uei" })
@Meta.tag(Catalogue.Tag.organization, Catalogue.Tag.identifier)
@UI.label("Organization UEI")
@minLength(12)
@maxLength(12)
scalar OrgUei extends string;

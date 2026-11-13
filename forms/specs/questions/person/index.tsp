import "simpler-forms";

import "#questions/index.tsp";
import "#questions/types/address.tsp";
import "#questions/types/codes.tsp";
import "#questions/types/contact-info.tsp";

import "./name.tsp";
import "./title.tsp";

using SimplerForms;

namespace Questions.People;

/** A person's address. */
@Meta.question(#{ id: "person/address" })
@UI.label("Address")
model PersonAddress is Questions.Types.Address;

/** Enter the daytime telephone number. */
@Meta.question(#{ id: "person/phone-number" })
@Meta.tag(Catalogue.Tag.person, Catalogue.Tag.phone)
@UI.label("Phone Number")
scalar PersonPhoneNumber extends Questions.Types.PhoneNumber;

/** Enter the fax number. */
@Meta.question(#{ id: "person/fax-number" })
@Meta.tag(Catalogue.Tag.person, Catalogue.Tag.phone)
@UI.label("Fax Number")
scalar PersonFaxNumber extends Questions.Types.PhoneNumber;

/** Enter a valid email address. */
@Meta.question(#{ id: "person/email" })
@Meta.tag(Catalogue.Tag.person, Catalogue.Tag.email)
@UI.label("Email")
scalar PersonEmail extends Questions.Types.EmailAddress;

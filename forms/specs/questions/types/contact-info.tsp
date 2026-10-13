import "simpler-forms";

import "#questions/index.tsp";

using SimplerForms;

namespace Questions.Types;

// `globLib:TelephoneNumberDataType` and `globLib:EmailDataType`, which every phone, fax and
// email question extends: `PersonPhoneNumber`, and in time an `OrgPhoneNumber`.
/** Enter the daytime telephone number. */
@Meta.question(#{ id: "types/contact-info/phone-number" })
@Meta.tag(Catalogue.Tag.phone)
@UI.label("Phone Number")
@minLength(1)
@maxLength(25)
scalar PhoneNumber extends string;

// `globLib:EmailDataType` is minLength 1, maxLength 60, so both bounds are declared here.
/** Enter a valid email address. */
@Meta.question(#{ id: "types/contact-info/email-address" })
@Meta.tag(Catalogue.Tag.email)
@UI.label("Email")
@format("email")
@minLength(1)
@maxLength(60)
scalar EmailAddress extends string;

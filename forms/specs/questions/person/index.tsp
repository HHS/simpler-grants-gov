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

// `globLib:ContactPersonDataTypeV3`. Used as-is wherever a form asks for a contact person
// whose role is given by where the person sits in the form (e.g. EPA's Payee). A role that
// adds fields of its own, like a key contact's project role, is a separate question that
// spreads this one.
/** A person and how to reach them. */
@Meta.question(#{ id: "person" })
@Meta.tag(Catalogue.Tag.person, Catalogue.Tag.details)
@UI.label("Contact Person")
@example(Questions.People.Examples.usContact)
model Person {
  /** Enter the person's name. First and last name are required. */
  @UI.label("Name")
  name: Questions.People.PersonName;

  /** Enter the position title. */
  @UI.label("Title")
  title?: Questions.People.PersonTitle;

  /** Enter the person's complete address. */
  @UI.label("Address")
  address: Questions.People.PersonAddress;

  // `ContactPersonDataTypeV3` makes the phone optional; the forms that ask for a contact
  // person require it.
  /** Enter the phone number. */
  @UI.label("Phone Number")
  phone: Questions.People.PersonPhoneNumber;

  /** Enter the fax number. */
  @UI.label("Fax Number")
  fax?: Questions.People.PersonFaxNumber;

  /** Enter the email address. */
  @UI.label("Email")
  email?: Questions.People.PersonEmail;
}

/** Sample people, type-checked against `Person` and reused by the forms' examples. */
namespace Examples {
  const usContact: Questions.People.Person = #{
    name: #{ prefix: "Ms.", firstName: "Alicia", lastName: "Reyes" },
    title: "Executive Director",
    address: #{
      street1: "100 Grant Avenue",
      city: "Denver",
      state: Questions.Types.StateCode.CO,
      zipCode: "80202-1234",
      country: Questions.Types.CountryCode.USA,
    },
    phone: "3035550100",
    email: "alicia.reyes@example.org",
  };

  const usContactNoEmail: Questions.People.Person = #{
    name: #{ firstName: "Marcus", lastName: "Lee" },
    title: "Controller",
    address: #{
      street1: "100 Grant Avenue",
      street2: "Suite 400",
      city: "Denver",
      state: Questions.Types.StateCode.CO,
      zipCode: "80202-1234",
      country: Questions.Types.CountryCode.USA,
    },
    phone: "3035550101",
    fax: "3035550199",
  };

  const internationalContact: Questions.People.Person = #{
    name: #{ prefix: "Dr.", firstName: "Tom", lastName: "Okafor", suffix: "PhD" },
    title: "Lead Scientist",
    address: #{
      street1: "456 Rio",
      city: "Montevideo",
      province: "Montevideo",
      country: Questions.Types.CountryCode.URY,
    },
    phone: "1234567890",
    email: "tom.okafor@example.edu",
  };
}

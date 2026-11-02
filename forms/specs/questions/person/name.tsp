import "simpler-forms";

import "#questions/index.tsp";

using SimplerForms;

// Maps to globLib:HumanNameDataType (PrefixName, FirstName, MiddleName, LastName, SuffixName).
namespace Questions.People;

/** The parts of a person's name, one scalar per field. */
namespace NameParts {
  /** Enter the prefix. */
  @Meta.question(#{ id: "person/name/prefix" })
  @minLength(1)
  @maxLength(10)
  scalar Prefix extends string;

  /** Enter the first name. */
  @Meta.question(#{ id: "person/name/first-name" })
  @minLength(1)
  @maxLength(35)
  scalar FirstName extends string;

  /** Enter the middle name. */
  @Meta.question(#{ id: "person/name/middle-name" })
  @minLength(1)
  @maxLength(25)
  scalar MiddleName extends string;

  /** Enter the last name. */
  @Meta.question(#{ id: "person/name/last-name" })
  @minLength(1)
  @maxLength(60)
  scalar LastName extends string;

  /** Enter the suffix. */
  @Meta.question(#{ id: "person/name/suffix" })
  @minLength(1)
  @maxLength(10)
  scalar Suffix extends string;
}

/** A person's name, in five parts. First and last name are required. */
@Meta.question(#{ id: "person/name" })
@Meta.tag(Catalogue.Tag.person, Catalogue.Tag.name)
@UI.label("Name")
model PersonName {
  @UI.label("Prefix")
  prefix?: Questions.People.NameParts.Prefix;

  @UI.label("First Name")
  firstName: Questions.People.NameParts.FirstName;

  @UI.label("Middle Name")
  middleName?: Questions.People.NameParts.MiddleName;

  @UI.label("Last Name")
  lastName: Questions.People.NameParts.LastName;

  @UI.label("Suffix")
  suffix?: Questions.People.NameParts.Suffix;
}

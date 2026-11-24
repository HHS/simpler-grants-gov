import "@typespec/xml";
import "form-library-xml";
import "simpler-forms";

import "#mapping/targets.tsp";
import "#xsd/global-library.tsp";

import "./form.tsp";

using TypeSpec.Xml;
using SimplerForms;

/** EPA_KeyContacts_2_0-V2.0.xsd */
namespace XSD.EPAKeyContacts20;

alias grantsGovXml = Mappings.Target.grantsGovXml;
alias EPAKeyContacts = Forms.EPAKeyContacts.EPAKeyContacts;
alias GlobLib = XSD.GlobLib;
alias Contact = Forms.EPAKeyContacts.EPAContact;

@nsDeclarations
enum Namespaces {
  EPA_KeyContacts_2_0: "http://apply.grants.gov/forms/EPA_KeyContacts_2_0-V2.0",
  globLib: "http://apply.grants.gov/system/GlobalLibrary-V2.0",
  codes: "http://apply.grants.gov/system/UniversalCodes-V2.0",
}

@name("KeyContactPersons_2_0")
@ns(Namespaces.EPA_KeyContacts_2_0)
@GrantsGov.xsd("https://apply07.grants.gov/apply/forms/schemas/EPA_KeyContacts_2_0-V2.0.xsd")
@Mapping.from(grantsGovXml, EPAKeyContacts)
model Root {
  @Mapping.from(grantsGovXml, EPAKeyContacts.authorizedRepresentative)
  @name("AuthorizedRepresentative")
  authorizedRepresentative?: GlobLib.ContactPersonDataTypeV3;

  @Mapping.from(grantsGovXml, EPAKeyContacts.payee)
  @name("Payee")
  payee?: GlobLib.ContactPersonDataTypeV3;

  // The XSD spells it this way.
  @Mapping.from(grantsGovXml, EPAKeyContacts.administrativeContact)
  @name("AdminstrativeContact")
  administrativeContact?: GlobLib.ContactPersonDataTypeV3;

  @Mapping.from(grantsGovXml, EPAKeyContacts.projectManager)
  @name("ProjectManager")
  projectManager?: GlobLib.ContactPersonDataTypeV3;

  @attribute @name("FormVersion") formVersion: "2.0";
}

// =============================================================================
// CONTACT PERSON
// =============================================================================

// Each role's `ContactPersonDataTypeV3` is filled from the form's own `EPAContact`.
@@Mapping.from(
  GlobLib.ContactPersonDataTypeV3.name,
  grantsGovXml,
  Contact.name
);
@@Mapping.from(
  GlobLib.ContactPersonDataTypeV3.title,
  grantsGovXml,
  Contact.title
);
@@Mapping.from(
  GlobLib.ContactPersonDataTypeV3.address,
  grantsGovXml,
  Contact.address
);
@@Mapping.from(
  GlobLib.ContactPersonDataTypeV3.phone,
  grantsGovXml,
  Contact.phone
);
@@Mapping.from(GlobLib.ContactPersonDataTypeV3.fax, grantsGovXml, Contact.fax);
@@Mapping.from(
  GlobLib.ContactPersonDataTypeV3.email,
  grantsGovXml,
  Contact.email
);

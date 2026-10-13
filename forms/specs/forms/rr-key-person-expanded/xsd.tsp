import "@typespec/xml";
import "form-library-xml";
import "simpler-forms";

import "#mapping/targets.tsp";
import "#xsd/attachments.tsp";
import "#xsd/global-library.tsp";

import "./form.tsp";

using TypeSpec.Xml;
using SimplerForms;

/** RR_KeyPersonExpanded_4_0-V4.0.xsd */
namespace XSD.RRKeyPersonExpanded40;

alias grantsGovXml = Mappings.Target.grantsGovXml;
alias KeyPersonForm = Forms.RRKeyPersonExpanded.RRKeyPersonExpanded;
alias KeyPersonEntry = Forms.RRKeyPersonExpanded.RRExpandedKeyPersonEntry;
alias KeyPersonProfile = Forms.RRKeyPersonExpanded.RRExpandedKeyPersonProfile;
alias GlobLib = XSD.GlobLib;
alias Att = XSD.Att;

@nsDeclarations
enum Namespaces {
  RR_KeyPersonExpanded_4_0: "http://apply.grants.gov/forms/RR_KeyPersonExpanded_4_0-V4.0",
  globLib: "http://apply.grants.gov/system/GlobalLibrary-V2.0",
  codes: "http://apply.grants.gov/system/UniversalCodes-V2.0",
  glob: "http://apply.grants.gov/system/Global-V1.0",
  att: "http://apply.grants.gov/system/Attachments-V1.0",
}

@name("RR_KeyPersonExpanded_4_0")
@GrantsGov.xsd("https://apply07.grants.gov/apply/forms/schemas/RR_KeyPersonExpanded_4_0-V4.0.xsd")
@Mapping.from(grantsGovXml, KeyPersonForm)
@ns(Namespaces.RR_KeyPersonExpanded_4_0)
model Root {
  @Mapping.from(grantsGovXml, KeyPersonForm.principalInvestigator)
  @name("PDPI")
  pdpi: PersonProfileDataType;

  @Mapping.from(grantsGovXml, KeyPersonForm.seniorKeyPersons)
  @name("KeyPerson")
  @maxItems(99)
  keyPerson?: PersonProfileDataType[];

  @name("AdditionalProfilesAttached")
  additionalProfilesAttached?: AdditionalProfilesAttached;

  @name("BioSketchsAttached")
  bioSketchsAttached?: AdditionalBioSketchsAttached;

  @name("SupportsAttached")
  supportsAttached?: AdditionalSupportsAttached;

  @attribute @name("FormVersion") formVersion: "4.0";
}

/** A person on the form: their `Profile`. */
@ns(Namespaces.RR_KeyPersonExpanded_4_0)
model PersonProfileDataType {
  @Mapping.from(grantsGovXml, KeyPersonEntry.profile)
  @name("Profile")
  profile: Profile;
}

/** A person's profile. */
@ns(Namespaces.RR_KeyPersonExpanded_4_0)
model Profile {
  @Mapping.from(grantsGovXml, KeyPersonProfile.name)
  @name("Name")
  name: GlobLib.HumanNameDataType;

  @Mapping.from(grantsGovXml, KeyPersonProfile.title)
  @name("Title")
  title?: string;

  @Mapping.from(grantsGovXml, KeyPersonProfile.address)
  @name("Address")
  address: GlobLib.AddressDataTypeV3;

  @Mapping.from(grantsGovXml, KeyPersonProfile.phone)
  @name("Phone")
  phone: string;

  @Mapping.from(grantsGovXml, KeyPersonProfile.fax)
  @name("Fax")
  fax?: string;

  @Mapping.from(grantsGovXml, KeyPersonProfile.email)
  @name("Email")
  email: string;

  @Mapping.from(grantsGovXml, KeyPersonProfile.organizationName)
  @name("OrganizationName")
  organizationName?: string;

  @Mapping.from(grantsGovXml, KeyPersonProfile.department)
  @name("Department")
  department?: string;

  @Mapping.from(grantsGovXml, KeyPersonProfile.division)
  @name("Division")
  division?: string;

  @Mapping.from(grantsGovXml, KeyPersonProfile.credential)
  @name("Credential")
  credential?: string;

  @Mapping.from(grantsGovXml, KeyPersonProfile.projectRole)
  @name("ProjectRole")
  projectRole: string;

  @Mapping.from(grantsGovXml, KeyPersonProfile.otherProjectRoleCategory)
  @name("OtherProjectRoleCategory")
  otherProjectRoleCategory?: string;

  @Mapping.from(grantsGovXml, KeyPersonProfile.degreeType)
  @name("DegreeType")
  degreeType?: string;

  @Mapping.from(grantsGovXml, KeyPersonProfile.degreeYear)
  @name("DegreeYear")
  degreeYear?: string;

  @name("BioSketchsAttached")
  bioSketchsAttached?: BioSketchsAttached;

  @name("SupportsAttached")
  supportsAttached?: SupportsAttached;
}

/** The profile's biographical sketch. */
@ns(Namespaces.RR_KeyPersonExpanded_4_0)
model BioSketchsAttached {
  @Mapping.from(grantsGovXml, KeyPersonProfile.biographicalSketch)
  @name("BioSketchAttached")
  bioSketchAttached?: Att.AttachedFileDataType;
}

/** The profile's current and pending support. */
@ns(Namespaces.RR_KeyPersonExpanded_4_0)
model SupportsAttached {
  @Mapping.from(grantsGovXml, KeyPersonProfile.currentPendingSupport)
  @name("SupportAttached")
  supportAttached?: Att.AttachedFileDataType;
}

/** Profiles of senior/key persons the form has no room for. */
@ns(Namespaces.RR_KeyPersonExpanded_4_0)
model AdditionalProfilesAttached {
  @Mapping.from(grantsGovXml, KeyPersonForm.additionalProfiles)
  @name("AdditionalProfileAttached")
  additionalProfileAttached?: Att.AttachedFileDataType;
}

/** Biographical sketches of senior/key persons the form has no room for. */
@ns(Namespaces.RR_KeyPersonExpanded_4_0)
model AdditionalBioSketchsAttached {
  @Mapping.from(grantsGovXml, KeyPersonForm.additionalBiographicalSketches)
  @name("BioSketchAttached")
  bioSketchAttached?: Att.AttachedFileDataType;
}

/** Current and pending support of senior/key persons the form has no room for. */
@ns(Namespaces.RR_KeyPersonExpanded_4_0)
model AdditionalSupportsAttached {
  @Mapping.from(grantsGovXml, KeyPersonForm.additionalCurrentPendingSupport)
  @name("SupportAttached")
  supportAttached?: Att.AttachedFileDataType;
}

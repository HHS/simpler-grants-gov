import "@typespec/xml";
import "form-library-xml";
import "simpler-forms";

import "#mapping/targets.tsp";
import "#xsd/attachments.tsp";
import "#xsd/global-library.tsp";

import "./form.tsp";

using TypeSpec.Xml;
using SimplerForms;

/** NSF_KeyPersonExpanded_3_3-V3.3.xsd */
namespace XSD.NSFKeyPersonExpanded33;

alias grantsGovXml = Mappings.Target.grantsGovXml;
alias KeyPersonForm = Forms.NSFKeyPersonExpanded.NSFKeyPersonExpanded;
alias PrincipalInvestigatorProfile = Forms.NSFKeyPersonExpanded.NSFPrincipalInvestigatorProfile;
alias SeniorKeyPersonProfile = Forms.NSFKeyPersonExpanded.NSFSeniorKeyPersonProfile;
alias GlobLib = XSD.GlobLib;
alias Att = XSD.Att;

// =============================================================================
// ROOT ELEMENT
// =============================================================================

@nsDeclarations
enum Namespaces {
  NSF_KeyPersonExpanded_3_3: "http://apply.grants.gov/forms/NSF_KeyPersonExpanded_3_3-V3.3",
  globLib: "http://apply.grants.gov/system/GlobalLibrary-V2.0",
  codes: "http://apply.grants.gov/system/UniversalCodes-V2.0",
  glob: "http://apply.grants.gov/system/Global-V1.0",
  att: "http://apply.grants.gov/system/Attachments-V1.0",
}

@name("NSF_KeyPersonExpanded_3_3")
@GrantsGov.xsd("https://apply07.grants.gov/apply/forms/schemas/NSF_KeyPersonExpanded_3_3-V3.3.xsd")
@Mapping.from(grantsGovXml, KeyPersonForm)
@ns(Namespaces.NSF_KeyPersonExpanded_3_3)
model Root {
  @Mapping.from(grantsGovXml, KeyPersonForm.principalInvestigator)
  @name("PDPI")
  pdpi: PDPIProfileDataType;

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

  @name("CollaboratorsAttached")
  collaboratorsAttached?: AdditionalCollaboratorsAttached;

  @name("SynergisticActivitiesAttached")
  synergisticActivitiesAttached?: AdditionalSynergisticActivitiesAttached;

  @attribute @name("FormVersion") formVersion: "3.3";
}

// =============================================================================
// PEOPLE
// =============================================================================

/** The PD/PI on the form: their `Profile`, filled from the same answers. */
@ns(Namespaces.NSF_KeyPersonExpanded_3_3)
model PDPIProfileDataType {
  @name("Profile")
  profile: PDPIProfile;
}

/** A senior/key person on the form: their `Profile`, filled from the same answers. */
@ns(Namespaces.NSF_KeyPersonExpanded_3_3)
model PersonProfileDataType {
  @name("Profile")
  profile: PersonProfile;
}

/** The PD/PI's profile, which names the organization. */
@ns(Namespaces.NSF_KeyPersonExpanded_3_3)
model PDPIProfile {
  @Mapping.from(grantsGovXml, PrincipalInvestigatorProfile.name)
  @name("Name")
  name: GlobLib.HumanNameDataType;

  @Mapping.from(grantsGovXml, PrincipalInvestigatorProfile.title)
  @name("Title")
  title?: string;

  @Mapping.from(grantsGovXml, PrincipalInvestigatorProfile.address)
  @name("Address")
  address: GlobLib.AddressDataTypeV3;

  @Mapping.from(grantsGovXml, PrincipalInvestigatorProfile.phone)
  @name("Phone")
  phone: string;

  @Mapping.from(grantsGovXml, PrincipalInvestigatorProfile.fax)
  @name("Fax")
  fax?: string;

  @Mapping.from(grantsGovXml, PrincipalInvestigatorProfile.email)
  @name("Email")
  email: string;

  @Mapping.from(grantsGovXml, PrincipalInvestigatorProfile.organizationName)
  @name("OrganizationName")
  organizationName?: string;

  @Mapping.from(grantsGovXml, PrincipalInvestigatorProfile.department)
  @name("Department")
  department?: string;

  @Mapping.from(grantsGovXml, PrincipalInvestigatorProfile.division)
  @name("Division")
  division?: string;

  @Mapping.from(grantsGovXml, PrincipalInvestigatorProfile.projectRole)
  @name("ProjectRole")
  projectRole: string;

  @Mapping.from(grantsGovXml, PrincipalInvestigatorProfile.nsfId)
  @name("NSFID")
  nsfId?: string;

  ...ProfileAttachments;
}

/** A senior/key person's profile, which gives the organization's UEI. */
@ns(Namespaces.NSF_KeyPersonExpanded_3_3)
model PersonProfile {
  @Mapping.from(grantsGovXml, SeniorKeyPersonProfile.name)
  @name("Name")
  name: GlobLib.HumanNameDataType;

  @Mapping.from(grantsGovXml, SeniorKeyPersonProfile.title)
  @name("Title")
  title?: string;

  @Mapping.from(grantsGovXml, SeniorKeyPersonProfile.address)
  @name("Address")
  address: GlobLib.AddressDataTypeV3;

  @Mapping.from(grantsGovXml, SeniorKeyPersonProfile.phone)
  @name("Phone")
  phone: string;

  @Mapping.from(grantsGovXml, SeniorKeyPersonProfile.fax)
  @name("Fax")
  fax?: string;

  @Mapping.from(grantsGovXml, SeniorKeyPersonProfile.email)
  @name("Email")
  email: string;

  @Mapping.from(grantsGovXml, SeniorKeyPersonProfile.organizationUei)
  @name("OrganizationUEIID")
  organizationUeiId?: string;

  @Mapping.from(grantsGovXml, SeniorKeyPersonProfile.department)
  @name("Department")
  department?: string;

  @Mapping.from(grantsGovXml, SeniorKeyPersonProfile.division)
  @name("Division")
  division?: string;

  @Mapping.from(grantsGovXml, SeniorKeyPersonProfile.projectRole)
  @name("ProjectRole")
  projectRole: string;

  @Mapping.from(grantsGovXml, SeniorKeyPersonProfile.nsfId)
  @name("NSFID")
  nsfId?: string;

  ...ProfileAttachments;
}

// =============================================================================
// ATTACHMENTS
// =============================================================================

/** The four attachments every profile requires. */
model ProfileAttachments {
  @name("BioSketchsAttached")
  bioSketchsAttached: BioSketchsAttached;

  @name("SupportsAttached")
  supportsAttached: SupportsAttached;

  @name("CollaboratorsAttached")
  collaboratorsAttached: CollaboratorsAttached;

  @name("SynergisticActivitiesAttached")
  synergisticActivitiesAttached: SynergisticActivitiesAttached;
}

/** The profile's biographical sketch. */
@ns(Namespaces.NSF_KeyPersonExpanded_3_3)
model BioSketchsAttached {
  @Mapping.from(grantsGovXml, PrincipalInvestigatorProfile.biographicalSketch)
  @Mapping.from(grantsGovXml, SeniorKeyPersonProfile.biographicalSketch)
  @name("BioSketchAttached")
  bioSketchAttached: Att.AttachedFileDataType;
}

/** The profile's current and pending (other) support. */
@ns(Namespaces.NSF_KeyPersonExpanded_3_3)
model SupportsAttached {
  @Mapping.from(grantsGovXml, PrincipalInvestigatorProfile.currentPendingSupport)
  @Mapping.from(grantsGovXml, SeniorKeyPersonProfile.currentPendingSupport)
  @name("SupportAttached")
  supportAttached: Att.AttachedFileDataType;
}

/** The profile's collaborators and other affiliations. */
@ns(Namespaces.NSF_KeyPersonExpanded_3_3)
model CollaboratorsAttached {
  @Mapping.from(grantsGovXml, PrincipalInvestigatorProfile.collaborators)
  @Mapping.from(grantsGovXml, SeniorKeyPersonProfile.collaborators)
  @name("CollaboratorAttached")
  collaboratorAttached: Att.AttachedFileDataType;
}

/** The profile's synergistic activities. */
@ns(Namespaces.NSF_KeyPersonExpanded_3_3)
model SynergisticActivitiesAttached {
  @Mapping.from(grantsGovXml, PrincipalInvestigatorProfile.synergisticActivities)
  @Mapping.from(grantsGovXml, SeniorKeyPersonProfile.synergisticActivities)
  @name("SynergisticAttached")
  synergisticAttached: Att.AttachedFileDataType;
}

/** Profiles of senior/key persons the form has no room for. */
@ns(Namespaces.NSF_KeyPersonExpanded_3_3)
model AdditionalProfilesAttached {
  @Mapping.from(grantsGovXml, KeyPersonForm.additionalProfiles)
  @name("AdditionalProfileAttached")
  additionalProfileAttached?: Att.AttachedFileDataType;
}

/** Biographical sketches of senior/key persons the form has no room for. */
@ns(Namespaces.NSF_KeyPersonExpanded_3_3)
model AdditionalBioSketchsAttached {
  @Mapping.from(grantsGovXml, KeyPersonForm.additionalBiographicalSketches)
  @name("BioSketchAttached")
  bioSketchAttached?: Att.AttachedFileDataType;
}

/** Current and pending (other) support of senior/key persons the form has no room for. */
@ns(Namespaces.NSF_KeyPersonExpanded_3_3)
model AdditionalSupportsAttached {
  @Mapping.from(grantsGovXml, KeyPersonForm.additionalCurrentPendingSupport)
  @name("SupportAttached")
  supportAttached?: Att.AttachedFileDataType;
}

/** Collaborators and other affiliations of senior/key persons the form has no room for. */
@ns(Namespaces.NSF_KeyPersonExpanded_3_3)
model AdditionalCollaboratorsAttached {
  @Mapping.from(grantsGovXml, KeyPersonForm.additionalCollaborators)
  @name("CollaboratorAttached")
  collaboratorAttached?: Att.AttachedFileDataType;
}

/** Synergistic activities of senior/key persons the form has no room for. */
@ns(Namespaces.NSF_KeyPersonExpanded_3_3)
model AdditionalSynergisticActivitiesAttached {
  @Mapping.from(grantsGovXml, KeyPersonForm.additionalSynergisticActivities)
  @name("SynergisticAttached")
  synergisticAttached?: Att.AttachedFileDataType;
}

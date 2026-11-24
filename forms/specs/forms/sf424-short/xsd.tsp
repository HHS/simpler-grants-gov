import "@typespec/xml";
import "form-library-xml";
import "simpler-forms";

import "#mapping/targets.tsp";
import "#mapping/transforms.tsp";
import "#questions/certification/index.tsp";
import "#xsd/global-library.tsp";

import "./form.tsp";

using TypeSpec.Xml;
using SimplerForms;

/** SF424_Short_3_0-V3.0.xsd */
namespace XSD.SF424Short30;

alias grantsGovXml = Mappings.Target.grantsGovXml;
alias Transformation = Mappings.Transforms.Transformation;
alias GlobLib = XSD.GlobLib;

alias Form = Forms.SF424Short.SF424Short;
alias Opportunity = Forms.SF424Short.ShortOpportunity;
alias Application = Forms.SF424Short.ShortApplication;
alias Applicant = Forms.SF424Short.ShortApplicant;
alias Organization = Forms.SF424Short.ShortOrganization;
alias ApplicantType = Forms.SF424Short.ShortApplicantType;
alias Project = Forms.SF424Short.ShortProject;
alias Timeline = Forms.SF424Short.ShortProjectTimeline;
alias Contacts = Forms.SF424Short.ShortContacts;
alias Representative = Forms.SF424Short.ShortRepresentative;
alias Contact = Forms.SF424Short.ShortContact;
alias PointOfContact = Forms.SF424Short.ShortPointOfContact;

// =============================================================================
// ROOT ELEMENT
// =============================================================================

@nsDeclarations
enum Namespaces {
  SF424_Short_3_0: "http://apply.grants.gov/forms/SF424_Short_3_0-V3.0",
  globLib: "http://apply.grants.gov/system/GlobalLibrary-V2.0",
  glob: "http://apply.grants.gov/system/Global-V1.0",
  att: "http://apply.grants.gov/system/Attachments-V1.0",
}

@name("SF424_Short_3_0")
@ns(Namespaces.SF424_Short_3_0)
@GrantsGov.xsd("https://apply07.grants.gov/apply/forms/schemas/SF424_Short_3_0-V3.0.xsd")
@Mapping.from(grantsGovXml, Form)
model Root {
  @Mapping.from(grantsGovXml, Opportunity.agencyName)
  @name("AgencyName")
  agencyName: string;

  @Mapping.from(grantsGovXml, Questions.Opportunities.AssistanceListing.number)
  @name("CFDANumber")
  assistanceListingNumber?: string;

  @Mapping.from(grantsGovXml, Questions.Opportunities.AssistanceListing.title)
  @name("CFDAProgramTitle")
  assistanceListingProgramTitle?: string;

  @Mapping.from(grantsGovXml, Application.dateReceived)
  @name("DateReceived")
  dateReceived: plainDate;

  @Mapping.from(grantsGovXml, Opportunity.number)
  @name("FundingOpportunityNumber")
  fundingOpportunityNumber: string;

  @Mapping.from(grantsGovXml, Opportunity.title)
  @name("FundingOpportunityTitle")
  fundingOpportunityTitle: string;

  @Mapping.from(grantsGovXml, Organization.name)
  @name("OrganizationName")
  organizationName: string;

  @Mapping.from(grantsGovXml, Organization.address)
  @name("Address")
  applicant: GlobLib.AddressDataTypeV3;

  @Mapping.from(grantsGovXml, Organization.webAddress)
  @name("ApplicantWebAddress")
  applicantWebAddress?: url;

  @Mapping.from(grantsGovXml, Mapping.Item<ApplicantType.codes, 0>)
  @name("ApplicantTypeCode1")
  applicantTypeCode1: string;

  @Mapping.from(grantsGovXml, Mapping.Item<ApplicantType.codes, 1>)
  @name("ApplicantTypeCode2")
  applicantTypeCode2?: string;

  @Mapping.from(grantsGovXml, Mapping.Item<ApplicantType.codes, 2>)
  @name("ApplicantTypeCode3")
  applicantTypeCode3?: string;

  @Mapping.from(grantsGovXml, ApplicantType.otherSpecify)
  @name("ApplicantTypeOtherSpecify")
  applicantTypeOtherSpecify?: string;

  @Mapping.from(grantsGovXml, Organization.ein)
  @name("EmployerTaxpayerIdentificationNumber")
  employerTaxpayerIdentificationNumber: string;

  @Mapping.from(grantsGovXml, Organization.uei)
  @name("SAMUEI")
  samUei: string;

  @Mapping.from(grantsGovXml, Applicant.congressionalDistrict)
  @name("CongressionalDistrictApplicant")
  congressionalDistrictApplicant: string;

  @Mapping.from(grantsGovXml, Project.title)
  @name("ProjectTitle")
  projectTitle: string;

  @Mapping.from(grantsGovXml, Project.description)
  @name("ProjectDescription")
  projectDescription: string;

  @Mapping.from(grantsGovXml, Timeline.startDate)
  @name("ProjectStartDate")
  projectStartDate: plainDate;

  @Mapping.from(grantsGovXml, Timeline.endDate)
  @name("ProjectEndDate")
  projectEndDate: plainDate;

  @Mapping.from(grantsGovXml, Contacts.projectDirector)
  @name("ProjectDirectorGroup")
  projectDirector: ContactPerson;

  @Mapping.from(grantsGovXml, PointOfContact.sameAsProjectDirector)
  @Mapping.transform(Transformation.booleanToYesNo)
  @name("SameAsProjectDirector")
  sameAsProjectDirector?: string;

  @Mapping.from(grantsGovXml, Contacts.pointOfContact)
  @name("ContactPersonGroup")
  contactPerson?: ContactPerson;

  @Mapping.from(grantsGovXml, Questions.Certifications.Certification.agree)
  @Mapping.transform(Transformation.booleanToYesNo)
  @name("ApplicationCertification")
  applicationCertification: string;

  @Mapping.from(grantsGovXml, Representative.name)
  @name("AuthorizedRepresentative")
  authorizedRepresentative: GlobLib.HumanNameDataType;

  @Mapping.from(grantsGovXml, Representative.title)
  @name("AuthorizedRepresentativeTitle")
  authorizedRepresentativeTitle: string;

  @Mapping.from(grantsGovXml, Representative.email)
  @name("AuthorizedRepresentativeEmail")
  authorizedRepresentativeEmail: string;

  @Mapping.from(grantsGovXml, Representative.phone)
  @name("AuthorizedRepresentativePhoneNumber")
  authorizedRepresentativePhoneNumber: string;

  @Mapping.from(grantsGovXml, Representative.fax)
  @name("AuthorizedRepresentativeFaxNumber")
  authorizedRepresentativeFax?: string;

  @Mapping.from(grantsGovXml, Questions.Certifications.Certification.signature)
  @name("AuthorizedRepresentativeSignature")
  aorSignature: string;

  @Mapping.from(grantsGovXml, Questions.Certifications.Certification.dateSigned)
  @name("AuthorizedRepresentativeDateSigned")
  authorizedRepresentativeDateSigned: plainDate;

  @attribute @name("FormVersion") formVersion: "3.0";
}

// =============================================================================
// CONTACT PERSON
// =============================================================================

// EPA Key Contacts fills the shared `ContactPersonDataTypeV3` from its own contact, so this
// form maps the same elements from `ShortContact` here. `ShortPointOfContact` spreads
// `ShortContact`, so the mapping fills both roles.
/** `globLib:ContactPersonDataTypeV3` */
@ns(Namespaces.globLib)
model ContactPerson {
  @Mapping.from(grantsGovXml, Contact.name)
  @name("Name")
  name: GlobLib.HumanNameDataType;

  @Mapping.from(grantsGovXml, Contact.title)
  @name("Title")
  title?: string;

  @Mapping.from(grantsGovXml, Contact.address)
  @name("Address")
  address: GlobLib.AddressDataTypeV3;

  @Mapping.from(grantsGovXml, Contact.phone)
  @name("Phone")
  phone?: string;

  @Mapping.from(grantsGovXml, Contact.fax)
  @name("Fax")
  fax?: string;

  @Mapping.from(grantsGovXml, Contact.email)
  @name("Email")
  email?: string;
}

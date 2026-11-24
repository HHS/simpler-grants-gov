import "@typespec/xml";
import "form-library-xml";
import "simpler-forms";

import "#mapping/targets.tsp";
import "#mapping/transforms.tsp";
import "#xsd/attachments.tsp";

import "./form.tsp";

using TypeSpec.Xml;
using SimplerForms;

/** RR_SF424_Multi_Project_Cover_4_0-V4.0.xsd */
namespace XSD.SF424ResearchMultiProject40;

alias xml = Mappings.Target.grantsGovXml;
alias F = Forms.SF424ResearchMultiProject;
alias Certification = Forms.SF424ResearchMultiProject.MultiProjectCertification;
alias Contact = Forms.SF424ResearchMultiProject.MultiProjectContact;
alias ContactPerson = Forms.SF424ResearchMultiProject.MultiProjectContactPerson;
alias PersonOrganization = Forms.SF424ResearchMultiProject.MultiProjectPersonOrganization;
alias Address = Forms.SF424ResearchMultiProject.MultiProjectAddress;
alias Name = Forms.SF424ResearchMultiProject.MultiProjectName;
alias Listing = Questions.Opportunities.AssistanceListing;
alias yesNo = Mappings.Transforms.Transformation.booleanToYesNo;
alias currency = Mappings.Transforms.Transformation.currencyFormat;

// =============================================================================
// ROOT ELEMENT
// =============================================================================

// Every element is optional. The XSD declares its own optional organization, address, and
// name types, so their child elements are in this form's namespace, not `globLib`.
@nsDeclarations
enum Namespaces {
  RR_SF424_Multi_Project_Cover_4_0: "http://apply.grants.gov/forms/RR_SF424_Multi_Project_Cover_4_0-V4.0",
  globLib: "http://apply.grants.gov/system/GlobalLibrary-V2.0",
  att: "http://apply.grants.gov/system/Attachments-V1.0",
  glob: "http://apply.grants.gov/system/Global-V1.0",
}

@name("RR_SF424_Multi_Project_Cover_4_0")
@ns(Namespaces.RR_SF424_Multi_Project_Cover_4_0)
@GrantsGov.xsd("https://apply07.grants.gov/apply/forms/schemas/RR_SF424_Multi_Project_Cover_4_0-V4.0.xsd")
@Mapping.from(xml, F.MultiProjectCover)
model Root {
  @Mapping.from(xml, F.MultiProjectApplication.submissionType)
  @name("SubmissionTypeCode")
  submissionTypeCode?: string;

  @Mapping.from(xml, F.MultiProjectApplication.dateSubmitted)
  @name("SubmittedDate")
  submittedDate?: plainDate;

  @Mapping.from(xml, F.MultiProjectApplication.applicantId)
  @name("ApplicantID")
  applicantID?: string;

  @Mapping.from(xml, Forms.SF424Research.ResearchStateApplication.receivedDate)
  @name("StateReceivedDate")
  stateReceivedDate?: plainDate;

  @Mapping.from(xml, Forms.SF424Research.ResearchStateApplication.applicationId)
  @name("StateID")
  stateID?: string;

  @Mapping.from(xml, F.MultiProjectApplication.federalIdentifier)
  @name("FederalID")
  federalID?: string;

  @Mapping.from(xml, F.MultiProjectApplication.agencyRoutingNumber)
  @name("AgencyRoutingNumber")
  agencyRoutingNumber?: string;

  // R&R's `GGTrackingID`: the same previous Grants.gov tracking ID, renamed.
  @Mapping.from(xml, F.MultiProjectApplication.previousTrackingId)
  @name("GrantsTrackingNumber")
  grantsTrackingNumber?: string;

  @name("ApplicantInfo")
  applicantInfo?: ApplicantInfo;

  @Mapping.from(xml, F.MultiProjectOrganization.ein)
  @name("EmployerID")
  employerID?: string;

  @Mapping.from(xml, F.MultiProjectApplicant.type)
  @name("ApplicantType")
  applicantType?: ApplicantType;

  @name("ApplicationType")
  applicationType?: ApplicationType;

  @Mapping.from(xml, F.MultiProjectOpportunity.agencyName)
  @name("FederalAgencyName")
  federalAgencyName?: string;

  @Mapping.from(xml, Listing.number)
  @name("CFDANumber")
  cfdaNumber?: string;

  @Mapping.from(xml, Listing.title)
  @name("ActivityTitle")
  activityTitle?: string;

  @Mapping.from(xml, F.MultiProjectProject.title)
  @name("ProjectTitle")
  projectTitle?: string;

  @Mapping.from(xml, F.MultiProjectProject.timeline)
  @name("ProposedProjectPeriod")
  proposedProjectPeriod?: ProjectPeriod;

  @name("CongressionalDistrict")
  congressionalDistrict?: CongressionalDistrict;

  @Mapping.from(xml, F.MultiProjectContacts.projectDirector)
  @name("PDPIContactInfo")
  pDPIContactInfo?: OrganizationContactPerson;

  @Mapping.from(xml, F.MultiProjectBudget.fundingSources)
  @name("EstimatedProjectFunding")
  estimatedProjectFunding?: Funding;

  @Mapping.from(xml, F.MultiProjectApplication.stateReview)
  @name("StateReview")
  stateReview?: StateReview;

  @Mapping.from(xml, Certification.agree)
  @Mapping.transform(yesNo)
  @name("TrustAgree")
  trustAgree?: string;

  @Mapping.from(xml, Forms.SF424Research.ResearchAttachments.lobbyingDisclosure)
  @name("SFLLLAttachment")
  sflllAttachment?: XSD.Att.AttachedFileDataType;

  @Mapping.from(xml, F.MultiProjectContacts.authorizedRepresentative)
  @name("AORInfo")
  aorInfo?: OrganizationContactPerson;

  @Mapping.from(xml, Forms.SF424Research.ResearchAttachments.preApplication)
  @name("PreApplicationAttachment")
  preApplicationAttachment?: XSD.Att.AttachedFileDataType;

  @Mapping.from(xml, Forms.SF424Research.ResearchAttachments.coverLetter)
  @name("CoverLetterAttachment")
  coverLetterAttachment?: XSD.Att.AttachedFileDataType;

  // Unlike R&R, the signature follows the attachments.
  @Mapping.from(xml, Certification.signature)
  @name("AOR_Signature")
  aorSignature?: string;

  @Mapping.from(xml, Certification.dateSigned)
  @name("AOR_SignedDate")
  aorSignedDate?: plainDate;

  @attribute @name("FormVersion") formVersion: "4.0";
}

// =============================================================================
// APPLICANT
// =============================================================================

@ns(Namespaces.RR_SF424_Multi_Project_Cover_4_0)
model ApplicantInfo {
  @Mapping.from(xml, F.MultiProjectApplicant.organization)
  @name("OrganizationInfo")
  organizationInfo?: OptionalOrganization;

  @Mapping.from(xml, F.MultiProjectContacts.pointOfContact)
  @name("ContactPersonInfo")
  contactPersonInfo?: ApplicantContact;
}

/** `OptionalOrganizationType` */
@ns(Namespaces.RR_SF424_Multi_Project_Cover_4_0)
model OptionalOrganization {
  @Mapping.from(xml, F.MultiProjectOrganization.name)
  @name("OrganizationName")
  organizationName?: string;

  @Mapping.from(xml, F.MultiProjectOrganization.uei)
  @name("SAMUEI")
  samUei?: string;

  @Mapping.from(xml, F.MultiProjectOrganization.department)
  @name("Department")
  department?: string;

  @Mapping.from(xml, F.MultiProjectOrganization.division)
  @name("Division")
  division?: string;

  @Mapping.from(xml, F.MultiProjectOrganization.address)
  @name("Address")
  address?: OptionalAddress;

  // This optional element has no DAT answer. The form collects EmployerID once.
  @name("EIN")
  ein?: string;
}

/** `OptionalAddressType`. State and Province are an `xs:choice`. */
@ns(Namespaces.RR_SF424_Multi_Project_Cover_4_0)
model OptionalAddress {
  @Mapping.from(xml, Address.street1)
  @name("Street1")
  street1?: string;

  @Mapping.from(xml, Address.street2)
  @name("Street2")
  street2?: string;

  @Mapping.from(xml, Address.city)
  @name("City")
  city?: string;

  @Mapping.from(xml, Address.county)
  @name("County")
  county?: string;

  @Mapping.from(xml, Address.state)
  @name("State")
  state?: string;

  @Mapping.from(xml, Address.province)
  @name("Province")
  province?: string;

  @Mapping.from(xml, Address.zipCode)
  @name("ZipPostalCode")
  zipPostalCode?: string;

  @Mapping.from(xml, Address.country)
  @name("Country")
  country?: string;
}

/** `OptionalHumanNameType` */
@ns(Namespaces.RR_SF424_Multi_Project_Cover_4_0)
model OptionalHumanName {
  @Mapping.from(xml, Name.prefix)
  @name("PrefixName")
  prefixName?: string;

  @Mapping.from(xml, Name.firstName)
  @name("FirstName")
  firstName?: string;

  @Mapping.from(xml, Name.middleName)
  @name("MiddleName")
  middleName?: string;

  @Mapping.from(xml, Name.lastName)
  @name("LastName")
  lastName?: string;

  @Mapping.from(xml, Name.suffix)
  @name("SuffixName")
  suffixName?: string;
}

@ns(Namespaces.RR_SF424_Multi_Project_Cover_4_0)
model ApplicantContact {
  @Mapping.from(xml, ContactPerson.name)
  @name("Name")
  name?: OptionalHumanName;

  @Mapping.from(xml, ContactPerson.title)
  @name("Title")
  title?: string;

  @Mapping.from(xml, ContactPerson.address)
  @name("Address")
  address?: OptionalAddress;

  @Mapping.from(xml, ContactPerson.phone)
  @name("Phone")
  phone?: string;

  @Mapping.from(xml, ContactPerson.fax)
  @name("Fax")
  fax?: string;

  @Mapping.from(xml, ContactPerson.email)
  @name("Email")
  email?: string;
}

@ns(Namespaces.RR_SF424_Multi_Project_Cover_4_0)
model ApplicantType {
  @Mapping.from(xml, F.MultiProjectApplicantType.code)
  @name("ApplicantTypeCode")
  applicantTypeCode?: string;

  @Mapping.from(xml, F.MultiProjectApplicantType.otherSpecify)
  @name("ApplicantTypeCodeOtherExplanation")
  applicantTypeCodeOtherExplanation?: string;

  @Mapping.from(xml, F.MultiProjectApplicantType.smallBusiness)
  @Mapping.when(
    F.MultiProjectApplicantType.code,
    Operator.equals,
    "R: Small Business"
  )
  @name("SmallBusinessOrganizationType")
  smallBusinessOrganizationType?: SmallBusiness;
}

@ns(Namespaces.RR_SF424_Multi_Project_Cover_4_0)
model SmallBusiness {
  @Mapping.from(xml, Forms.SF424Research.ResearchSmallBusiness.womenOwned)
  @Mapping.transform(yesNo)
  @name("isWomenOwned")
  isWomenOwned?: string;

  @Mapping.from(
    xml,
    Forms.SF424Research.ResearchSmallBusiness.sociallyDisadvantaged
  )
  @Mapping.transform(yesNo)
  @name("isSociallyEconomicallyDisadvantaged")
  isSociallyEconomicallyDisadvantaged?: string;
}

// =============================================================================
// APPLICATION TYPE
// =============================================================================

@ns(Namespaces.RR_SF424_Multi_Project_Cover_4_0)
model ApplicationType {
  @Mapping.from(xml, F.MultiProjectApplication.applicationType)
  @name("ApplicationTypeCode")
  applicationTypeCode?: string;

  @Mapping.from(xml, F.MultiProjectRevision.type)
  @name("RevisionCode")
  revisionCode?: string;

  @Mapping.from(xml, F.MultiProjectRevision.otherSpecify)
  @name("RevisionCodeOtherExplanation")
  revisionCodeOtherExplanation?: string;

  @Mapping.from(xml, F.MultiProjectOtherAgencies.submitted)
  @Mapping.transform(yesNo)
  @name("isOtherAgencySubmission")
  isOtherAgencySubmission?: string;

  @Mapping.from(xml, F.MultiProjectOtherAgencies.explanation)
  @name("OtherAgencySubmissionExplanation")
  otherAgencySubmissionExplanation?: string;
}

// =============================================================================
// PROJECT
// =============================================================================

@ns(Namespaces.RR_SF424_Multi_Project_Cover_4_0)
model ProjectPeriod {
  @Mapping.from(xml, F.MultiProjectTimeline.startDate)
  @name("ProposedStartDate")
  proposedStartDate?: plainDate;

  @Mapping.from(xml, F.MultiProjectTimeline.endDate)
  @name("ProposedEndDate")
  proposedEndDate?: plainDate;
}

@ns(Namespaces.RR_SF424_Multi_Project_Cover_4_0)
model CongressionalDistrict {
  @Mapping.from(xml, F.MultiProjectApplicant.congressionalDistrict)
  @name("ApplicantCongressionalDistrict")
  applicantCongressionalDistrict?: string;
}

// =============================================================================
// CONTACTS
// =============================================================================

// `OrganizationContactPersonDataType` and `AORInfoType`, identical here: R&R's AOR requires its
// title, this form's does not.
@ns(Namespaces.RR_SF424_Multi_Project_Cover_4_0)
model OrganizationContactPerson {
  @Mapping.from(xml, Contact.name)
  @name("Name")
  name?: OptionalHumanName;

  @Mapping.from(xml, Contact.title)
  @name("Title")
  title?: string;

  @Mapping.from(xml, Contact.address)
  @name("Address")
  address?: OptionalAddress;

  @Mapping.from(xml, Contact.phone)
  @name("Phone")
  phone?: string;

  @Mapping.from(xml, Contact.fax)
  @name("Fax")
  fax?: string;

  @Mapping.from(xml, Contact.email)
  @name("Email")
  email?: string;

  @Mapping.from(xml, PersonOrganization.name)
  @name("OrganizationName")
  organizationName?: string;

  @Mapping.from(xml, PersonOrganization.department)
  @name("Department")
  department?: string;

  @Mapping.from(xml, PersonOrganization.division)
  @name("Division")
  division?: string;
}

// =============================================================================
// FUNDING AND STATE REVIEW
// =============================================================================

@ns(Namespaces.RR_SF424_Multi_Project_Cover_4_0)
model Funding {
  @Mapping.from(xml, F.MultiProjectFundingSources.federal)
  @Mapping.transform(currency)
  @name("TotalEstimatedAmount")
  totalEstimatedAmount?: string;

  @Mapping.from(xml, F.MultiProjectFundingSources.nonFederal)
  @Mapping.transform(currency)
  @name("TotalNonfedrequested")
  totalNonfedrequested?: string;

  @Mapping.from(xml, F.MultiProjectFundingSources.total)
  @Mapping.transform(currency)
  @name("TotalfedNonfedrequested")
  totalfedNonfedrequested?: string;

  @Mapping.from(xml, F.MultiProjectFundingSources.programIncome)
  @Mapping.transform(currency)
  @name("EstimatedProgramIncome")
  estimatedProgramIncome?: string;
}

@ns(Namespaces.RR_SF424_Multi_Project_Cover_4_0)
model StateReview {
  @Mapping.from(xml, F.MultiProjectStateReview.status)
  @name("StateReviewCodeType")
  stateReviewCodeType?: string;

  @Mapping.from(xml, F.MultiProjectStateReview.date)
  @name("StateReviewDate")
  stateReviewDate?: plainDate;
}

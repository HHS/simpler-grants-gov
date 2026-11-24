import "@typespec/xml";
import "form-library-xml";
import "simpler-forms";

import "#mapping/targets.tsp";
import "#mapping/transforms.tsp";
import "#xsd/attachments.tsp";
import "#xsd/global-library.tsp";

import "./form.tsp";

using TypeSpec.Xml;
using SimplerForms;

/** RR_SF424_5_0-V5.0.xsd */
namespace XSD.SF424Research50;

alias xml = Mappings.Target.grantsGovXml;
alias F = Forms.SF424Research;
alias Certification = Questions.Certifications.Certification;
alias Contact = Forms.SF424Research.ResearchContact;
alias ContactPerson = Forms.SF424Research.ResearchContactPerson;
alias PersonOrganization = Forms.SF424Research.ResearchPersonOrganization;
alias yesNo = Mappings.Transforms.Transformation.booleanToYesNo;

// =============================================================================
// ROOT ELEMENT
// =============================================================================

@nsDeclarations
enum Namespaces {
  RR_SF424_5_0: "http://apply.grants.gov/forms/RR_SF424_5_0-V5.0",
  globLib: "http://apply.grants.gov/system/GlobalLibrary-V2.0",
  att: "http://apply.grants.gov/system/Attachments-V1.0",
  glob: "http://apply.grants.gov/system/Global-V1.0",
}

@name("RR_SF424_5_0")
@ns(Namespaces.RR_SF424_5_0)
@GrantsGov.xsd("https://apply07.grants.gov/apply/forms/schemas/RR_SF424_5_0-V5.0.xsd")
@Mapping.from(xml, F.ResearchCover)
model Root {
  @Mapping.from(xml, F.ResearchApplication.submissionType)
  @name("SubmissionTypeCode")
  submissionTypeCode: string;

  @Mapping.from(xml, F.ResearchApplication.dateSubmitted)
  @name("SubmittedDate")
  submittedDate?: plainDate;

  @Mapping.from(xml, F.ResearchApplication.applicantId)
  @name("ApplicantID")
  applicantID?: string;

  @Mapping.from(xml, F.ResearchStateApplication.receivedDate)
  @name("StateReceivedDate")
  stateReceivedDate?: plainDate;

  @Mapping.from(xml, F.ResearchStateApplication.applicationId)
  @name("StateID")
  stateID?: string;

  @Mapping.from(xml, F.ResearchApplication.federalIdentifier)
  @name("FederalID")
  federalID?: string;

  @Mapping.from(xml, F.ResearchApplication.agencyRoutingNumber)
  @name("AgencyRoutingNumber")
  agencyRoutingNumber?: string;

  @Mapping.from(xml, F.ResearchApplication.previousTrackingId)
  @name("GGTrackingID")
  ggTrackingId?: string;

  @name("ApplicantInfo")
  applicantInfo: ApplicantInfo;

  @Mapping.from(xml, F.ResearchOrganization.ein)
  @name("EmployerID")
  employerID: string;

  @Mapping.from(xml, F.ResearchApplicant.type)
  @name("ApplicantType")
  applicantType: ApplicantType;

  @name("ApplicationType")
  applicationType: ApplicationType;

  @Mapping.from(xml, F.ResearchOpportunity.agencyName)
  @name("FederalAgencyName")
  federalAgencyName: string;

  @Mapping.from(xml, Questions.Opportunities.AssistanceListing.number)
  @name("CFDANumber")
  cfdaNumber?: string;

  @Mapping.from(xml, Questions.Opportunities.AssistanceListing.title)
  @name("ActivityTitle")
  activityTitle?: string;

  @Mapping.from(xml, F.ResearchProject.title)
  @name("ProjectTitle")
  projectTitle: string;

  @Mapping.from(xml, F.ResearchProject.timeline)
  @name("ProposedProjectPeriod")
  proposedProjectPeriod: ProjectPeriod;

  @name("CongressionalDistrict")
  congressionalDistrict: CongressionalDistrict;

  @Mapping.from(xml, F.ResearchContacts.projectDirector)
  @name("PDPIContactInfo")
  pDPIContactInfo: ResearchContact;

  @Mapping.from(xml, F.ResearchBudget.fundingSources)
  @name("EstimatedProjectFunding")
  estimatedProjectFunding: Funding;

  @Mapping.from(xml, F.ResearchApplication.stateReview)
  @name("StateReview")
  stateReview: StateReview;

  @Mapping.from(xml, Certification.agree)
  @Mapping.transform(yesNo)
  @name("TrustAgree")
  trustAgree: string;

  @Mapping.from(xml, F.ResearchAttachments.lobbyingDisclosure)
  @name("SFLLLAttachment")
  sflllAttachment?: XSD.Att.AttachedFileDataType;

  @Mapping.from(xml, F.ResearchContacts.authorizedRepresentative)
  @name("AORInfo")
  aorInfo: AuthorizedRepresentative;

  @Mapping.from(xml, Certification.signature)
  @name("AOR_Signature")
  aorSignature: string;

  @Mapping.from(xml, Certification.dateSigned)
  @name("AOR_SignedDate")
  aorSignedDate: plainDate;

  @Mapping.from(xml, F.ResearchAttachments.preApplication)
  @name("PreApplicationAttachment")
  preApplicationAttachment?: XSD.Att.AttachedFileDataType;

  @Mapping.from(xml, F.ResearchAttachments.coverLetter)
  @name("CoverLetterAttachment")
  coverLetterAttachment?: XSD.Att.AttachedFileDataType;

  @attribute @name("FormVersion") formVersion: "5.0";
}

// =============================================================================
// APPLICANT
// =============================================================================

@ns(Namespaces.RR_SF424_5_0)
model ApplicantInfo {
  @Mapping.from(xml, F.ResearchApplicant.organization)
  @name("OrganizationInfo")
  organizationInfo: Organization;

  @Mapping.from(xml, F.ResearchContacts.pointOfContact)
  @name("ContactPersonInfo")
  contactPersonInfo: ApplicantContact;
}

model Organization {
  @Mapping.from(xml, F.ResearchOrganization.name)
  @ns(Namespaces.globLib)
  @name("OrganizationName")
  organizationName: string;

  @Mapping.from(xml, F.ResearchOrganization.uei)
  @ns(Namespaces.globLib)
  @name("SAMUEI")
  samUei: string;

  @Mapping.from(xml, F.ResearchOrganization.department)
  @ns(Namespaces.globLib)
  @name("Department")
  departmentName?: string;

  @Mapping.from(xml, F.ResearchOrganization.division)
  @ns(Namespaces.globLib)
  @name("Division")
  divisionName?: string;

  @Mapping.from(xml, F.ResearchOrganization.address)
  @ns(Namespaces.globLib)
  @name("Address")
  address: XSD.GlobLib.AddressDataTypeV3;

  // This imported optional element has no DAT answer. The form collects EmployerID once.
  @ns(Namespaces.globLib)
  @name("EIN")
  ein?: string;
}

@ns(Namespaces.RR_SF424_5_0)
model ApplicantContact {
  @Mapping.from(xml, ContactPerson.name)
  @name("Name")
  name: XSD.GlobLib.HumanNameDataType;

  @Mapping.from(xml, ContactPerson.title)
  @name("Title")
  title?: string;

  @Mapping.from(xml, ContactPerson.address)
  @name("Address")
  address: XSD.GlobLib.AddressDataTypeV3;

  @Mapping.from(xml, ContactPerson.phone)
  @name("Phone")
  phone: string;

  @Mapping.from(xml, ContactPerson.fax)
  @name("Fax")
  fax?: string;

  @Mapping.from(xml, ContactPerson.email)
  @name("Email")
  email?: string;
}

@ns(Namespaces.RR_SF424_5_0)
model ApplicantType {
  @Mapping.from(xml, F.ResearchApplicantType.code)
  @name("ApplicantTypeCode")
  applicantTypeCode: string;

  @Mapping.from(xml, F.ResearchApplicantType.otherSpecify)
  @name("ApplicantTypeCodeOtherExplanation")
  applicantTypeCodeOtherExplanation?: string;

  @Mapping.from(xml, F.ResearchApplicantType.smallBusiness)
  @Mapping.when(
    F.ResearchApplicantType.code,
    Operator.equals,
    "R: Small Business"
  )
  @name("SmallBusinessOrganizationType")
  smallBusinessOrganizationType?: SmallBusiness;
}

@ns(Namespaces.RR_SF424_5_0)
model SmallBusiness {
  @Mapping.from(xml, F.ResearchSmallBusiness.womenOwned)
  @Mapping.transform(yesNo)
  @name("isWomenOwned")
  isWomenOwned?: string;

  @Mapping.from(xml, F.ResearchSmallBusiness.sociallyDisadvantaged)
  @Mapping.transform(yesNo)
  @name("isSociallyEconomicallyDisadvantaged")
  isSociallyEconomicallyDisadvantaged?: string;
}

// =============================================================================
// APPLICATION TYPE
// =============================================================================

@ns(Namespaces.RR_SF424_5_0)
model ApplicationType {
  @Mapping.from(xml, F.ResearchApplication.applicationType)
  @name("ApplicationTypeCode")
  applicationTypeCode: string;

  @Mapping.from(xml, F.ResearchRevision.type)
  @name("RevisionCode")
  revisionCode?: string;

  @Mapping.from(xml, F.ResearchRevision.otherSpecify)
  @name("RevisionCodeOtherExplanation")
  revisionCodeOtherExplanation?: string;

  @Mapping.from(xml, F.ResearchOtherAgencies.submitted)
  @Mapping.transform(yesNo)
  @name("isOtherAgencySubmission")
  isOtherAgencySubmission: string;

  @Mapping.from(xml, F.ResearchOtherAgencies.explanation)
  @name("OtherAgencySubmissionExplanation")
  otherAgencySubmissionExplanation?: string;
}

// =============================================================================
// PROJECT
// =============================================================================

@ns(Namespaces.RR_SF424_5_0)
model ProjectPeriod {
  @Mapping.from(xml, F.ResearchTimeline.startDate)
  @name("ProposedStartDate")
  proposedStartDate: plainDate;

  @Mapping.from(xml, F.ResearchTimeline.endDate)
  @name("ProposedEndDate")
  proposedEndDate: plainDate;
}

@ns(Namespaces.RR_SF424_5_0)
model CongressionalDistrict {
  @Mapping.from(xml, F.ResearchApplicant.congressionalDistrict)
  @name("ApplicantCongressionalDistrict")
  applicantCongressionalDistrict: string;
}

// =============================================================================
// CONTACTS
// =============================================================================

@ns(Namespaces.RR_SF424_5_0)
model ResearchContact {
  @Mapping.from(xml, Contact.name)
  @name("Name")
  name: XSD.GlobLib.HumanNameDataType;

  @Mapping.from(xml, Contact.title)
  @name("Title")
  title?: string;

  @Mapping.from(xml, Contact.address)
  @name("Address")
  address: XSD.GlobLib.AddressDataTypeV3;

  @Mapping.from(xml, Contact.phone)
  @name("Phone")
  phone: string;

  @Mapping.from(xml, Contact.fax)
  @name("Fax")
  fax?: string;

  @Mapping.from(xml, Contact.email)
  @name("Email")
  email: string;

  @Mapping.from(xml, PersonOrganization.name)
  @name("OrganizationName")
  organizationName: string;

  @Mapping.from(xml, PersonOrganization.department)
  @name("Department")
  department?: string;

  @Mapping.from(xml, PersonOrganization.division)
  @name("Division")
  division?: string;
}

@ns(Namespaces.RR_SF424_5_0)
model AuthorizedRepresentative {
  ...PickProperties<ResearchContact, "name">;

  @Mapping.from(xml, Contact.title)
  @name("Title")
  title: string;

  ...OmitProperties<ResearchContact, "name" | "title">;
}

// =============================================================================
// FUNDING AND STATE REVIEW
// =============================================================================

@ns(Namespaces.RR_SF424_5_0)
model Funding {
  @Mapping.from(xml, F.ResearchFundingSources.federal)
  @Mapping.transform(Mappings.Transforms.Transformation.currencyFormat)
  @name("TotalEstimatedAmount")
  totalEstimatedAmount: string;

  @Mapping.from(xml, F.ResearchFundingSources.nonFederal)
  @Mapping.transform(Mappings.Transforms.Transformation.currencyFormat)
  @name("TotalNonfedrequested")
  totalNonfedrequested: string;

  @Mapping.from(xml, F.ResearchFundingSources.total)
  @Mapping.transform(Mappings.Transforms.Transformation.currencyFormat)
  @name("TotalfedNonfedrequested")
  totalfedNonfedrequested: string;

  @Mapping.from(xml, F.ResearchFundingSources.programIncome)
  @Mapping.transform(Mappings.Transforms.Transformation.currencyFormat)
  @name("EstimatedProgramIncome")
  estimatedProgramIncome: string;
}

@ns(Namespaces.RR_SF424_5_0)
model StateReview {
  @Mapping.from(xml, F.ResearchStateReview.status)
  @name("StateReviewCodeType")
  stateReviewCodeType: string;

  @Mapping.from(xml, F.ResearchStateReview.date)
  @name("StateReviewDate")
  stateReviewDate?: plainDate;
}

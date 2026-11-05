import "@typespec/xml";
import "form-library-xml";
import "simpler-forms";
import "#mapping/targets.tsp";
import "#mapping/transforms.tsp";
import "#xsd/global-library.tsp";
import "#xsd/attachments.tsp";
import "./form.tsp";

using TypeSpec.Xml;
using SimplerForms;
namespace XSD.SF424Research50;

alias xml = Mappings.Target.grantsGovXml;
alias F = Forms.SF424Research;
alias Person = Questions.People.Person;
alias yesNo = Mappings.Transforms.Transformation.booleanToYesNo;

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
  @Mapping.from(xml, F.Application.submissionType)
  @name("SubmissionTypeCode")
  submissionTypeCode: string;

  @Mapping.from(xml, F.Application.submittedDate)
  @name("SubmittedDate")
  submittedDate?: plainDate;

  @Mapping.from(xml, F.Application.applicantId)
  @name("ApplicantID")
  applicantID?: string;

  @Mapping.from(xml, F.Application.stateReceivedDate)
  @name("StateReceivedDate")
  stateReceivedDate?: plainDate;

  @Mapping.from(xml, F.Application.stateId)
  @name("StateID")
  stateID?: string;

  @Mapping.from(xml, F.Application.federalId)
  @name("FederalID")
  federalID?: string;

  @Mapping.from(xml, F.Application.agencyRoutingNumber)
  @name("AgencyRoutingNumber")
  agencyRoutingNumber?: string;

  @Mapping.from(xml, F.Application.trackingId)
  @name("GGTrackingID")
  ggTrackingId?: string;

  @name("ApplicantInfo")
  applicantInfo: ApplicantInfo;

  @Mapping.from(xml, F.ApplicantOrganization.employerId)
  @name("EmployerID")
  employerID: string;

  @Mapping.from(xml, F.ResearchCover.applicantType)
  @name("ApplicantType")
  applicantType: ApplicantType;

  @name("ApplicationType")
  applicationType: ApplicationType;

  @Mapping.from(xml, F.CoverOpportunity.agencyName)
  @name("FederalAgencyName")
  federalAgencyName: string;

  @Mapping.from(xml, F.CoverOpportunity.assistanceListingNumber)
  @name("CFDANumber")
  cfdaNumber?: string;

  @Mapping.from(xml, F.CoverOpportunity.assistanceListingTitle)
  @name("ActivityTitle")
  activityTitle?: string;

  @Mapping.from(xml, F.CoverProject.title)
  @name("ProjectTitle")
  projectTitle: string;

  @name("ProposedProjectPeriod")
  proposedProjectPeriod: ProjectPeriod;

  @name("CongressionalDistrict")
  congressionalDistrict: CongressionalDistrict;

  @Mapping.from(xml, F.ResearchCover.principalInvestigator)
  @name("PDPIContactInfo")
  pDPIContactInfo: ResearchContact;

  @Mapping.from(xml, F.ResearchCover.funding)
  @name("EstimatedProjectFunding")
  estimatedProjectFunding: Funding;

  @Mapping.from(xml, F.ResearchCover.stateReview)
  @name("StateReview")
  stateReview: StateReview;

  @Mapping.from(xml, F.CoverCertification.agree)
  @Mapping.transform(yesNo)
  @name("TrustAgree")
  trustAgree: string;

  @Mapping.from(xml, F.Attachments.lobbyingDisclosure)
  @name("SFLLLAttachment")
  sflllAttachment?: XSD.Att.AttachedFileDataType;

  @Mapping.from(xml, F.ResearchCover.authorizedRepresentative)
  @name("AORInfo")
  aorInfo: AuthorizedRepresentative;

  @Mapping.from(xml, F.CoverCertification.signature)
  @name("AOR_Signature")
  aorSignature: string;

  @Mapping.from(xml, F.CoverCertification.dateSigned)
  @name("AOR_SignedDate")
  aorSignedDate: plainDate;

  @Mapping.from(xml, F.Attachments.preApplication)
  @name("PreApplicationAttachment")
  preApplicationAttachment?: XSD.Att.AttachedFileDataType;

  @Mapping.from(xml, F.Attachments.coverLetter)
  @name("CoverLetterAttachment")
  coverLetterAttachment?: XSD.Att.AttachedFileDataType;

  @attribute @name("FormVersion") formVersion: "5.0";
}

@ns(Namespaces.RR_SF424_5_0)
model ApplicantInfo {
  @Mapping.from(xml, F.ResearchCover.applicantOrganization)
  @name("OrganizationInfo")
  organizationInfo: Organization;

  @Mapping.from(xml, F.ResearchCover.applicantContact)
  @name("ContactPersonInfo")
  contactPersonInfo: ApplicantContact;
}

model Organization {
  @Mapping.from(xml, F.ApplicantOrganization.name)
  @ns(Namespaces.globLib)
  @name("OrganizationName")
  organizationName: string;

  @Mapping.from(xml, F.ApplicantOrganization.uei)
  @ns(Namespaces.globLib)
  @name("SAMUEI")
  samUei: string;

  @Mapping.from(xml, F.ApplicantOrganization.department)
  @ns(Namespaces.globLib)
  @name("Department")
  departmentName?: string;

  @Mapping.from(xml, F.ApplicantOrganization.division)
  @ns(Namespaces.globLib)
  @name("Division")
  divisionName?: string;

  @Mapping.from(xml, F.ApplicantOrganization.address)
  @ns(Namespaces.globLib)
  @name("Address")
  address: XSD.GlobLib.AddressDataTypeV3;
}

@ns(Namespaces.RR_SF424_5_0)
model ApplicantContact {
  @Mapping.from(xml, Person.name)
  @name("Name")
  name: XSD.GlobLib.HumanNameDataType;

  @Mapping.from(xml, Person.title)
  @name("Title")
  title?: string;

  @Mapping.from(xml, Person.address)
  @name("Address")
  address: XSD.GlobLib.AddressDataTypeV3;

  @Mapping.from(xml, Person.phone)
  @name("Phone")
  phone: string;

  @Mapping.from(xml, Person.fax)
  @name("Fax")
  fax?: string;

  @Mapping.from(xml, Person.email)
  @name("Email")
  email?: string;
}

@ns(Namespaces.RR_SF424_5_0)
model ApplicantType {
  @Mapping.from(xml, F.CoverApplicantType.code)
  @Mapping.transform(
    Mappings.Transforms.Transformation.mapValues,
    #{
      mappings: #{
        `H: Public/state Controlled Institution of Higher Education`: "H: Public/State Controlled Institution of Higher Education",
      },
      passthrough_unknown: true,
    }
  )
  @name("ApplicantTypeCode")
  applicantTypeCode: string;

  @Mapping.from(xml, F.CoverApplicantType.otherExplanation)
  @name("ApplicantTypeCodeOtherExplanation")
  applicantTypeCodeOtherExplanation?: string;

  @Mapping.from(xml, F.CoverApplicantType.smallBusiness)
  @name("SmallBusinessOrganizationType")
  smallBusinessOrganizationType?: SmallBusiness;
}

@ns(Namespaces.RR_SF424_5_0)
model SmallBusiness {
  @Mapping.from(xml, F.SmallBusiness.womenOwned)
  @Mapping.transform(yesNo)
  @name("isWomenOwned")
  isWomenOwned?: string;

  @Mapping.from(xml, F.SmallBusiness.sociallyAndEconomicallyDisadvantaged)
  @Mapping.transform(yesNo)
  @name("isSociallyEconomicallyDisadvantaged")
  isSociallyEconomicallyDisadvantaged?: string;
}

@ns(Namespaces.RR_SF424_5_0)
model ApplicationType {
  @Mapping.from(xml, F.Application.applicationType)
  @name("ApplicationTypeCode")
  applicationTypeCode: string;

  @Mapping.from(xml, F.Application.revisionCode)
  @name("RevisionCode")
  revisionCode?: string;

  @Mapping.from(xml, F.Application.revisionExplanation)
  @name("RevisionCodeOtherExplanation")
  revisionCodeOtherExplanation?: string;

  @Mapping.from(xml, F.Application.submittedToOtherAgencies)
  @Mapping.transform(yesNo)
  @name("isOtherAgencySubmission")
  isOtherAgencySubmission: string;

  @Mapping.from(xml, F.Application.otherAgencyExplanation)
  @name("OtherAgencySubmissionExplanation")
  otherAgencySubmissionExplanation?: string;
}

@ns(Namespaces.RR_SF424_5_0)
model ProjectPeriod {
  @Mapping.from(xml, F.CoverProject.startDate)
  @name("ProposedStartDate")
  proposedStartDate: plainDate;

  @Mapping.from(xml, F.CoverProject.endDate)
  @name("ProposedEndDate")
  proposedEndDate: plainDate;
}

@ns(Namespaces.RR_SF424_5_0)
model CongressionalDistrict {
  @Mapping.from(xml, F.CoverProject.congressionalDistrict)
  @name("ApplicantCongressionalDistrict")
  applicantCongressionalDistrict: string;
}

@ns(Namespaces.RR_SF424_5_0)
model ResearchContact {
  @Mapping.from(xml, F.ResearchContact.name)
  @name("Name")
  name: XSD.GlobLib.HumanNameDataType;

  @Mapping.from(xml, F.ResearchContact.title)
  @name("Title")
  title?: string;

  @Mapping.from(xml, F.ResearchContact.address)
  @name("Address")
  address: XSD.GlobLib.AddressDataTypeV3;

  @Mapping.from(xml, F.ResearchContact.phone)
  @name("Phone")
  phone: string;

  @Mapping.from(xml, F.ResearchContact.fax)
  @name("Fax")
  fax?: string;

  @Mapping.from(xml, F.ResearchContact.email)
  @name("Email")
  email: string;

  @Mapping.from(xml, F.ResearchContact.organizationName)
  @name("OrganizationName")
  organizationName: string;

  @Mapping.from(xml, F.ResearchContact.department)
  @name("Department")
  department?: string;

  @Mapping.from(xml, F.ResearchContact.division)
  @name("Division")
  division?: string;
}

@ns(Namespaces.RR_SF424_5_0)
model AuthorizedRepresentative {
  ...PickProperties<ResearchContact, "name">;

  @Mapping.from(xml, F.ResearchContact.title)
  @name("Title")
  title: string;

  ...OmitProperties<ResearchContact, "name" | "title">;
}

@ns(Namespaces.RR_SF424_5_0)
model Funding {
  @Mapping.from(xml, F.Funding.federal)
  @Mapping.transform(Mappings.Transforms.Transformation.currencyFormat)
  @name("TotalEstimatedAmount")
  totalEstimatedAmount: string;

  @Mapping.from(xml, F.Funding.nonFederal)
  @Mapping.transform(Mappings.Transforms.Transformation.currencyFormat)
  @name("TotalNonfedrequested")
  totalNonfedrequested: string;

  @Mapping.from(xml, F.Funding.total)
  @Mapping.transform(Mappings.Transforms.Transformation.currencyFormat)
  @name("TotalfedNonfedrequested")
  totalfedNonfedrequested: string;

  @Mapping.from(xml, F.Funding.programIncome)
  @Mapping.transform(Mappings.Transforms.Transformation.currencyFormat)
  @name("EstimatedProgramIncome")
  estimatedProgramIncome: string;
}

@ns(Namespaces.RR_SF424_5_0)
model StateReview {
  @Mapping.from(xml, F.StateReview.status)
  @name("StateReviewCodeType")
  stateReviewCodeType: string;

  @Mapping.from(xml, F.StateReview.date)
  @name("StateReviewDate")
  stateReviewDate?: plainDate;
}

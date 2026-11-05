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
namespace XSD.SF424Mandatory30;
alias grantsGovXml = Mappings.Target.grantsGovXml;
alias Transformation = Mappings.Transforms.Transformation;
alias F = Forms.SF424Mandatory;
@nsDeclarations
enum Namespaces {
  SF424_Mandatory_3_0: "http://apply.grants.gov/forms/SF424_Mandatory_3_0-V3.0",
  globLib: "http://apply.grants.gov/system/GlobalLibrary-V2.0",
  att: "http://apply.grants.gov/system/Attachments-V1.0",
  glob: "http://apply.grants.gov/system/Global-V1.0",
  codes: "http://apply.grants.gov/system/UniversalCodes-V2.0",
}
@name("SF424_Mandatory_3_0")
@ns(Namespaces.SF424_Mandatory_3_0)
@GrantsGov.xsd("https://apply07.grants.gov/apply/forms/schemas/SF424_Mandatory_3_0-V3.0.xsd")
@Mapping.from(grantsGovXml, F.SF424Mandatory)
model Root {
  @Mapping.from(grantsGovXml, F.MandatorySubmission.type)
  @name("TypeOfSubmission")
  typeOfSubmission: string;

  @Mapping.from(grantsGovXml, F.MandatorySubmission.typeOtherDescription)
  @name("TypeOfSubmissionOtherDescription")
  typeOfSubmissionOtherDescription?: string;

  @Mapping.from(grantsGovXml, F.MandatorySubmission.frequency)
  @name("Frequency")
  frequency: string;

  @Mapping.from(grantsGovXml, F.MandatorySubmission.frequencyOtherDescription)
  @name("FrequencyOtherDescription")
  frequencyOtherDescription?: string;

  @Mapping.from(grantsGovXml, F.MandatorySubmission.consolidatedRequest)
  @Mapping.transform(Transformation.booleanToYesNo)
  @name("ConsolidatedRequest")
  consolidatedRequest?: string;

  @Mapping.from(
    grantsGovXml,
    F.MandatorySubmission.consolidatedRequestExplanation
  )
  @name("ConsolidatedRequestExplanation")
  consolidatedRequestExplanation?: string;

  @Mapping.from(grantsGovXml, F.MandatorySubmission.version)
  @name("Version")
  version: string;

  @Mapping.from(grantsGovXml, F.MandatoryDates.receivedDate)
  @name("ReceivedDate")
  receivedDate: plainDate;

  @Mapping.from(grantsGovXml, F.MandatoryIdentifiers.applicantId)
  @name("ApplicantID")
  applicantId?: string;

  @Mapping.from(grantsGovXml, F.MandatoryIdentifiers.federalEntityId)
  @name("FederalEntityID")
  federalEntityId?: string;

  @Mapping.from(grantsGovXml, F.MandatoryIdentifiers.federalAwardId)
  @name("FederalAwardID")
  federalAwardId?: string;

  @Mapping.from(grantsGovXml, F.MandatoryDates.stateReceivedDate)
  @name("StateReceivedDate")
  stateReceivedDate?: plainDate;

  @Mapping.from(grantsGovXml, F.MandatoryIdentifiers.stateApplicationId)
  @name("StateApplicationID")
  stateApplicationId?: string;

  @Mapping.from(grantsGovXml, F.SF424Mandatory.applicant)
  @name("Organization")
  organization?: Organization;

  @Mapping.from(grantsGovXml, F.MandatoryContact.name)
  @name("ContactName")
  contactName: XSD.GlobLib.HumanNameDataType;

  @Mapping.from(grantsGovXml, F.MandatoryContact.title)
  @name("ContactTitle")
  contactTitle?: string;

  @Mapping.from(grantsGovXml, F.MandatoryContact.organizationalAffiliation)
  @name("ContactOrganizationalAffiliation")
  contactOrganizationalAffiliation?: string;

  @Mapping.from(grantsGovXml, F.MandatoryContact.phone)
  @name("ContactPhoneNumber")
  contactPhoneNumber: string;

  @Mapping.from(grantsGovXml, F.MandatoryContact.fax)
  @name("ContactFax")
  contactFax?: string;

  @Mapping.from(grantsGovXml, F.MandatoryContact.email)
  @name("ContactEmail")
  contactEmail: string;

  @Mapping.from(grantsGovXml, F.MandatoryApplicantType.code)
  @name("ApplicantType")
  applicantType: string;

  @Mapping.from(grantsGovXml, F.MandatoryApplicantType.otherSpecify)
  @name("OtherTypeApplicant")
  otherTypeApplicant?: string;

  @Mapping.from(grantsGovXml, F.MandatoryApplicantType.additionalDescription)
  @name("AdditionalApplicantTypeDescription")
  additionalApplicantTypeDescription?: string;

  @Mapping.from(grantsGovXml, F.MandatoryOpportunity.agencyName)
  @name("AgencyName")
  agencyName: string;

  @Mapping.from(grantsGovXml, F.MandatoryAssistanceListing.number)
  @name("CFDANumber")
  cfdaNumber?: string;

  @Mapping.from(grantsGovXml, F.MandatoryAssistanceListing.title)
  @name("CFDATitle")
  cfdaTitle?: string;

  @Mapping.from(grantsGovXml, F.MandatoryProject.title)
  @name("DescriptiveProjectTitle")
  descriptiveProjectTitle: string;

  @Mapping.from(grantsGovXml, F.MandatoryProject.areasAffected)
  @name("AreasAffectedByFunding")
  areasAffectedByFunding?: string;

  @Mapping.from(grantsGovXml, F.MandatoryCongressionalDistricts.applicant)
  @name("CongressionalDistrictApplicant")
  congressionalDistrictApplicant: string;

  @Mapping.from(grantsGovXml, F.MandatoryCongressionalDistricts.project)
  @name("CongressionalDistrictProject")
  congressionalDistrictProject?: string;

  @Mapping.from(
    grantsGovXml,
    F.MandatoryCongressionalDistricts.additionalAttachment
  )
  @name("AdditionalCongressionalDistricts")
  additionalCongressionalDistricts?: XSD.Att.AttachedFileDataType;

  @Mapping.from(grantsGovXml, F.MandatoryFunding.startDate)
  @name("FundingPeriodStartDate")
  fundingPeriodStartDate: plainDate;

  @Mapping.from(grantsGovXml, F.MandatoryFunding.endDate)
  @name("FundingPeriodEndDate")
  fundingPeriodEndDate: plainDate;

  @Mapping.from(grantsGovXml, F.MandatoryFunding.estimatedFederal)
  @name("EstimatedFundingFederal")
  estimatedFundingFederal: decimal;

  @Mapping.from(grantsGovXml, F.MandatoryFunding.estimatedMatch)
  @name("EstimatedFundingMatch")
  estimatedFundingMatch?: decimal;

  @Mapping.from(grantsGovXml, F.MandatoryStateReview.status)
  @name("SubmissionUnderReview")
  submissionUnderReview: string;

  @Mapping.from(grantsGovXml, F.MandatoryStateReview.availableDate)
  @name("StateReviewAvailableDate")
  stateReviewAvailableDate?: plainDate;

  @Mapping.from(grantsGovXml, F.MandatoryDebt.isDelinquent)
  @Mapping.transform(Transformation.booleanToYesNo)
  @name("DelinquentOnFederalDebt")
  delinquentOnFederalDebt: string;

  @Mapping.from(grantsGovXml, F.MandatoryDebt.explanation)
  @name("DelinquentFederalDebtExplanation")
  delinquentFederalDebtExplanation?: string;

  @Mapping.from(grantsGovXml, F.MandatoryCertification.agree)
  @Mapping.transform(Transformation.booleanToYesNo)
  @name("ApplicationCertification")
  applicationCertification: string;

  @Mapping.from(grantsGovXml, F.MandatoryAuthorizedRepresentative.name)
  @name("AuthorizedRepresentativeName")
  authorizedRepresentativeName: XSD.GlobLib.HumanNameDataType;

  @Mapping.from(grantsGovXml, F.MandatoryAuthorizedRepresentative.title)
  @name("AuthorizedRepresentativeTitle")
  authorizedRepresentativeTitle: string;

  @Mapping.from(
    grantsGovXml,
    F.MandatoryAuthorizedRepresentative.organizationalAffiliation
  )
  @name("AuthorizedRepresentativeOrganizationalAffiliation")
  authorizedRepresentativeOrganizationalAffiliation?: string;

  @Mapping.from(grantsGovXml, F.MandatoryAuthorizedRepresentative.phone)
  @name("AuthorizedRepresentativePhoneNumber")
  authorizedRepresentativePhoneNumber: string;

  @Mapping.from(grantsGovXml, F.MandatoryAuthorizedRepresentative.fax)
  @name("AuthorizedRepresentativeFax")
  authorizedRepresentativeFax?: string;

  @Mapping.from(grantsGovXml, F.MandatoryAuthorizedRepresentative.email)
  @name("AuthorizedRepresentativeEmail")
  authorizedRepresentativeEmail: string;

  @Mapping.from(grantsGovXml, F.MandatoryAuthorizedRepresentative.signature)
  @name("AuthorizedRepresentativeSignature")
  authorizedRepresentativeSignature: string;

  @Mapping.from(grantsGovXml, F.MandatoryAuthorizedRepresentative.dateSigned)
  @name("AuthorizedRepresentativeSignatureDate")
  authorizedRepresentativeSignatureDate: plainDate;

  @name("attachments")
  attachments?: SupportingDocuments;

  @attribute @name("FormVersion") formVersion: "3.0";
}

@ns(Namespaces.globLib)
model Organization {
  @Mapping.from(grantsGovXml, F.MandatoryApplicant.legalName)
  @name("OrganizationName")
  organizationName: string;

  @Mapping.from(grantsGovXml, F.MandatoryApplicant.uei)
  @name("SAMUEI")
  sAMUEI: string;

  @Mapping.from(grantsGovXml, F.MandatoryApplicant.department)
  @name("DepartmentName")
  departmentName?: string;

  @Mapping.from(grantsGovXml, F.MandatoryApplicant.division)
  @name("DivisionName")
  divisionName?: string;

  @Mapping.from(grantsGovXml, F.MandatoryApplicant.address)
  @name("Address")
  address: XSD.GlobLib.AddressDataTypeV3;

  @Mapping.from(grantsGovXml, F.MandatoryApplicant.ein)
  @name("EIN")
  eIN?: string;
}

@ns(Namespaces.att)
model SupportingDocuments {
  @name("AttachedFile")
  @Mapping.from(grantsGovXml, F.SF424Mandatory.attachments)
  @maxItems(100)
  attachedFile: XSD.Att.AttachedFileDataType[];
}

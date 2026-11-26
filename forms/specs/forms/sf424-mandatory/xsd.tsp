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

namespace XSD.SF424Mandatory30;

alias grantsGovXml = Mappings.Target.grantsGovXml;
alias Transformation = Mappings.Transforms.Transformation;
alias F = Forms.SF424Mandatory;
alias Certification = Questions.Certifications.Certification;
alias AssistanceListing = Questions.Opportunities.AssistanceListing;

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
  @Mapping.from(grantsGovXml, F.MandatoryApplication.submissionType)
  @name("TypeOfSubmission")
  typeOfSubmission: string;

  @Mapping.from(grantsGovXml, F.MandatoryApplication.submissionTypeOther)
  @name("TypeOfSubmissionOtherDescription")
  typeOfSubmissionOtherDescription?: string;

  @Mapping.from(grantsGovXml, F.MandatoryFrequency.code)
  @name("Frequency")
  frequency: string;

  @Mapping.from(grantsGovXml, F.MandatoryFrequency.other)
  @name("FrequencyOtherDescription")
  frequencyOtherDescription?: string;

  @Mapping.from(grantsGovXml, F.MandatoryConsolidatedRequest.answer)
  @Mapping.transform(Transformation.booleanToYesNo)
  @name("ConsolidatedRequest")
  consolidatedRequest?: string;

  @Mapping.from(grantsGovXml, F.MandatoryConsolidatedRequest.explanation)
  @name("ConsolidatedRequestExplanation")
  consolidatedRequestExplanation?: string;

  @Mapping.from(grantsGovXml, F.MandatoryApplication.version)
  @name("Version")
  version: string;

  @Mapping.from(grantsGovXml, F.MandatoryApplication.dateReceived)
  @name("ReceivedDate")
  receivedDate: plainDate;

  @Mapping.from(grantsGovXml, F.MandatoryApplication.applicantId)
  @name("ApplicantID")
  applicantId?: string;

  @Mapping.from(grantsGovXml, F.MandatoryApplication.federalEntityIdentifier)
  @name("FederalEntityID")
  federalEntityId?: string;

  @Mapping.from(grantsGovXml, F.MandatoryApplication.federalAwardIdentifier)
  @name("FederalAwardID")
  federalAwardId?: string;

  @Mapping.from(grantsGovXml, F.MandatoryApplicationState.receivedDate)
  @name("StateReceivedDate")
  stateReceivedDate?: plainDate;

  @Mapping.from(grantsGovXml, F.MandatoryApplicationState.applicationId)
  @name("StateApplicationID")
  stateApplicationId?: string;

  @Mapping.from(grantsGovXml, F.MandatoryApplicant.organization)
  @name("Organization")
  organization?: Organization;

  @Mapping.from(grantsGovXml, F.MandatoryPointOfContact.name)
  @name("ContactName")
  contactName: XSD.GlobLib.HumanNameDataType;

  @Mapping.from(grantsGovXml, F.MandatoryPointOfContact.title)
  @name("ContactTitle")
  contactTitle?: string;

  @Mapping.from(grantsGovXml, F.MandatoryContactOrganization.name)
  @name("ContactOrganizationalAffiliation")
  contactOrganizationalAffiliation?: string;

  @Mapping.from(grantsGovXml, F.MandatoryPointOfContact.phone)
  @name("ContactPhoneNumber")
  contactPhoneNumber: string;

  @Mapping.from(grantsGovXml, F.MandatoryPointOfContact.fax)
  @name("ContactFax")
  contactFax?: string;

  @Mapping.from(grantsGovXml, F.MandatoryPointOfContact.email)
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

  @Mapping.from(grantsGovXml, AssistanceListing.number)
  @name("CFDANumber")
  cfdaNumber?: string;

  @Mapping.from(grantsGovXml, AssistanceListing.title)
  @name("CFDATitle")
  cfdaTitle?: string;

  @Mapping.from(grantsGovXml, F.MandatoryProject.title)
  @name("DescriptiveProjectTitle")
  descriptiveProjectTitle: string;

  @Mapping.from(grantsGovXml, F.MandatoryProject.areasAffected)
  @name("AreasAffectedByFunding")
  areasAffectedByFunding?: string;

  @Mapping.from(grantsGovXml, F.MandatoryApplicant.congressionalDistrict)
  @name("CongressionalDistrictApplicant")
  congressionalDistrictApplicant: string;

  @Mapping.from(grantsGovXml, F.MandatoryProject.congressionalDistrict)
  @name("CongressionalDistrictProject")
  congressionalDistrictProject?: string;

  @Mapping.from(
    grantsGovXml,
    F.MandatoryProject.additionalCongressionalDistricts
  )
  @name("AdditionalCongressionalDistricts")
  additionalCongressionalDistricts?: XSD.Att.AttachedFileDataType;

  @Mapping.from(grantsGovXml, F.MandatoryFundingPeriod.startDate)
  @name("FundingPeriodStartDate")
  fundingPeriodStartDate: plainDate;

  @Mapping.from(grantsGovXml, F.MandatoryFundingPeriod.endDate)
  @name("FundingPeriodEndDate")
  fundingPeriodEndDate: plainDate;

  @Mapping.from(grantsGovXml, F.MandatoryFundingSources.federal)
  @Mapping.transform(Transformation.currencyFormat)
  @name("EstimatedFundingFederal")
  estimatedFundingFederal: string;

  @Mapping.from(grantsGovXml, F.MandatoryFundingSources.match)
  @Mapping.transform(Transformation.currencyFormat)
  @name("EstimatedFundingMatch")
  estimatedFundingMatch?: string;

  @Mapping.from(grantsGovXml, F.MandatoryStateReview.status)
  @name("SubmissionUnderReview")
  submissionUnderReview: string;

  @Mapping.from(grantsGovXml, F.MandatoryStateReview.date)
  @name("StateReviewAvailableDate")
  stateReviewAvailableDate?: plainDate;

  @Mapping.from(grantsGovXml, F.MandatoryDelinquentFederalDebt.answer)
  @Mapping.transform(Transformation.booleanToYesNo)
  @name("DelinquentOnFederalDebt")
  delinquentOnFederalDebt: string;

  @Mapping.from(grantsGovXml, F.MandatoryDelinquentFederalDebt.explanation)
  @name("DelinquentFederalDebtExplanation")
  delinquentFederalDebtExplanation?: string;

  @Mapping.from(grantsGovXml, Certification.agree)
  @Mapping.transform(Transformation.booleanToYesNo)
  @name("ApplicationCertification")
  applicationCertification: string;

  @Mapping.from(grantsGovXml, F.MandatoryAuthorizedRepresentative.name)
  @name("AuthorizedRepresentativeName")
  authorizedRepresentativeName: XSD.GlobLib.HumanNameDataType;

  @Mapping.from(grantsGovXml, F.MandatoryAuthorizedRepresentative.title)
  @name("AuthorizedRepresentativeTitle")
  authorizedRepresentativeTitle: string;

  @Mapping.from(grantsGovXml, F.MandatoryRepresentativeOrganization.name)
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

  @Mapping.from(grantsGovXml, Certification.signature)
  @name("AuthorizedRepresentativeSignature")
  authorizedRepresentativeSignature: string;

  @Mapping.from(grantsGovXml, Certification.dateSigned)
  @name("AuthorizedRepresentativeSignatureDate")
  authorizedRepresentativeSignatureDate: plainDate;

  @name("attachments")
  attachments?: SupportingDocuments;

  @attribute @name("FormVersion") formVersion: "3.0";
}

@ns(Namespaces.globLib)
model Organization {
  @Mapping.from(grantsGovXml, F.MandatoryApplicantOrganization.name)
  @name("OrganizationName")
  organizationName: string;

  @Mapping.from(grantsGovXml, F.MandatoryApplicantOrganization.uei)
  @name("SAMUEI")
  sAMUEI: string;

  @Mapping.from(grantsGovXml, F.MandatoryApplicantOrganization.department)
  @name("DepartmentName")
  departmentName?: string;

  @Mapping.from(grantsGovXml, F.MandatoryApplicantOrganization.division)
  @name("DivisionName")
  divisionName?: string;

  @Mapping.from(grantsGovXml, F.MandatoryApplicantOrganization.address)
  @name("Address")
  address: XSD.GlobLib.AddressDataTypeV3;

  @Mapping.from(grantsGovXml, F.MandatoryApplicantOrganization.ein)
  @name("EIN")
  eIN?: string;
}

@ns(Namespaces.att)
model SupportingDocuments {
  @name("AttachedFile")
  @Mapping.from(grantsGovXml, F.MandatoryAttachments.additional)
  @maxItems(100)
  attachedFile: XSD.Att.AttachedFileDataType[];
}

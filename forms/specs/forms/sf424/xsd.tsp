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
namespace XSD.SF424Regular40;

alias grantsGovXml = Mappings.Target.grantsGovXml;
alias F = Forms.SF424Regular;

@nsDeclarations
enum Namespaces {
  SF424_4_0: "http://apply.grants.gov/forms/SF424_4_0-V4.0",
  globLib: "http://apply.grants.gov/system/GlobalLibrary-V2.0",
  att: "http://apply.grants.gov/system/Attachments-V1.0",
  glob: "http://apply.grants.gov/system/Global-V1.0",
}

@name("SF424_4_0")
@ns(Namespaces.SF424_4_0)
@GrantsGov.xsd("https://apply07.grants.gov/apply/forms/schemas/SF424_4_0-V4.0.xsd")
@Mapping.from(grantsGovXml, F.SF424)
model Root {
  @Mapping.from(grantsGovXml, F.RegularApplication.submissionType)
  @name("SubmissionType")
  submissionType: string;

  @Mapping.from(grantsGovXml, F.RegularApplication.applicationType)
  @name("ApplicationType")
  applicationType: string;

  @Mapping.from(grantsGovXml, F.RegularApplication.revisionType)
  @name("RevisionType")
  revisionType?: string;

  @Mapping.from(grantsGovXml, F.RegularApplication.revisionOtherSpecify)
  @name("RevisionOtherSpecify")
  revisionOtherSpecify?: string;

  @Mapping.from(grantsGovXml, F.RegularApplication.dateReceived)
  @name("DateReceived")
  dateReceived: plainDate;

  @Mapping.from(grantsGovXml, F.RegularApplication.applicantId)
  @name("ApplicantID")
  applicantID?: string;

  @Mapping.from(grantsGovXml, F.RegularApplication.federalEntityIdentifier)
  @name("FederalEntityIdentifier")
  federalEntityIdentifier?: string;

  @Mapping.from(grantsGovXml, F.RegularApplication.federalAwardIdentifier)
  @name("FederalAwardIdentifier")
  federalAwardIdentifier?: string;

  @Mapping.from(grantsGovXml, F.RegularApplication.stateReceiveDate)
  @name("StateReceiveDate")
  stateReceiveDate?: plainDate;

  @Mapping.from(grantsGovXml, F.RegularApplication.stateApplicationId)
  @name("StateApplicationID")
  stateApplicationID?: string;

  @Mapping.from(grantsGovXml, F.RegularApplicant.legalName)
  @name("OrganizationName")
  organizationName: string;

  @Mapping.from(grantsGovXml, F.RegularApplicant.ein)
  @name("EmployerTaxpayerIdentificationNumber")
  employerTaxpayerIdentificationNumber: string;

  @Mapping.from(grantsGovXml, F.RegularApplicant.uei)
  @name("SAMUEI")
  sAMUEI: string;

  @Mapping.from(grantsGovXml, F.RegularApplicant.address)
  @name("Applicant")
  applicant: XSD.GlobLib.AddressDataTypeV3;

  @Mapping.from(grantsGovXml, F.RegularApplicant.departmentName)
  @name("DepartmentName")
  departmentName?: string;

  @Mapping.from(grantsGovXml, F.RegularApplicant.divisionName)
  @name("DivisionName")
  divisionName?: string;

  @Mapping.from(grantsGovXml, F.RegularContact.name)
  @name("ContactPerson")
  contactPerson?: XSD.GlobLib.HumanNameDataType;

  @Mapping.from(grantsGovXml, F.RegularContact.title)
  @name("Title")
  title?: string;

  @Mapping.from(grantsGovXml, F.RegularContact.organizationalAffiliation)
  @name("OrganizationAffiliation")
  organizationAffiliation?: string;

  @Mapping.from(grantsGovXml, F.RegularContact.phone)
  @name("PhoneNumber")
  phoneNumber: string;

  @Mapping.from(grantsGovXml, F.RegularContact.fax)
  @name("Fax")
  fax?: string;

  @Mapping.from(grantsGovXml, F.RegularContact.email)
  @name("Email")
  email: string;

  @name("ApplicantTypeCode1") applicantTypeCode1: string;
  @name("ApplicantTypeCode2") applicantTypeCode2?: string;
  @name("ApplicantTypeCode3") applicantTypeCode3?: string;

  @Mapping.from(grantsGovXml, F.RegularApplicantType.otherExplanation)
  @name("ApplicantTypeOtherSpecify")
  applicantTypeOtherSpecify?: string;

  @Mapping.from(grantsGovXml, F.RegularOpportunity.agencyName)
  @name("AgencyName")
  agencyName: string;

  @Mapping.from(grantsGovXml, F.RegularOpportunity.assistanceListingNumber)
  @name("CFDANumber")
  cFDANumber?: string;

  @Mapping.from(grantsGovXml, F.RegularOpportunity.assistanceListingTitle)
  @name("CFDAProgramTitle")
  cFDAProgramTitle?: string;

  @Mapping.from(grantsGovXml, F.RegularOpportunity.number)
  @name("FundingOpportunityNumber")
  fundingOpportunityNumber: string;

  @Mapping.from(grantsGovXml, F.RegularOpportunity.title)
  @name("FundingOpportunityTitle")
  fundingOpportunityTitle: string;

  @Mapping.from(grantsGovXml, F.RegularOpportunity.competitionNumber)
  @name("CompetitionIdentificationNumber")
  competitionIdentificationNumber?: string;

  @Mapping.from(grantsGovXml, F.RegularOpportunity.competitionTitle)
  @name("CompetitionIdentificationTitle")
  competitionIdentificationTitle?: string;

  @Mapping.from(grantsGovXml, F.RegularProject.areasAffected)
  @name("AreasAffected")
  areasAffected?: XSD.Att.AttachedFileDataType;

  @Mapping.from(grantsGovXml, F.RegularProject.title)
  @name("ProjectTitle")
  projectTitle: string;

  @name("AdditionalProjectTitle")
  additionalProjectTitle?: AdditionalProjectTitle;

  @Mapping.from(grantsGovXml, F.RegularProject.congressionalDistrictApplicant)
  @name("CongressionalDistrictApplicant")
  congressionalDistrictApplicant: string;

  @Mapping.from(
    grantsGovXml,
    F.RegularProject.congressionalDistrictProgramProject
  )
  @name("CongressionalDistrictProgramProject")
  congressionalDistrictProgramProject: string;

  @Mapping.from(grantsGovXml, F.RegularProject.additionalCongressionalDistricts)
  @name("AdditionalCongressionalDistricts")
  additionalCongressionalDistricts?: XSD.Att.AttachedFileDataType;

  @Mapping.from(grantsGovXml, F.RegularProject.startDate)
  @name("ProjectStartDate")
  projectStartDate: plainDate;

  @Mapping.from(grantsGovXml, F.RegularProject.endDate)
  @name("ProjectEndDate")
  projectEndDate: plainDate;

  @Mapping.from(grantsGovXml, F.RegularFunding.federal)
  @Mapping.transform(Mappings.Transforms.Transformation.currencyFormat)
  @name("FederalEstimatedFunding")
  federalEstimatedFunding: string;

  @Mapping.from(grantsGovXml, F.RegularFunding.applicant)
  @Mapping.transform(Mappings.Transforms.Transformation.currencyFormat)
  @name("ApplicantEstimatedFunding")
  applicantEstimatedFunding: string;

  @Mapping.from(grantsGovXml, F.RegularFunding.state)
  @Mapping.transform(Mappings.Transforms.Transformation.currencyFormat)
  @name("StateEstimatedFunding")
  stateEstimatedFunding: string;

  @Mapping.from(grantsGovXml, F.RegularFunding.local)
  @Mapping.transform(Mappings.Transforms.Transformation.currencyFormat)
  @name("LocalEstimatedFunding")
  localEstimatedFunding: string;

  @Mapping.from(grantsGovXml, F.RegularFunding.other)
  @Mapping.transform(Mappings.Transforms.Transformation.currencyFormat)
  @name("OtherEstimatedFunding")
  otherEstimatedFunding: string;

  @Mapping.from(grantsGovXml, F.RegularFunding.programIncome)
  @Mapping.transform(Mappings.Transforms.Transformation.currencyFormat)
  @name("ProgramIncomeEstimatedFunding")
  programIncomeEstimatedFunding: string;

  @Mapping.from(grantsGovXml, F.RegularFunding.total)
  @Mapping.transform(Mappings.Transforms.Transformation.currencyFormat)
  @name("TotalEstimatedFunding")
  totalEstimatedFunding: string;

  @Mapping.from(grantsGovXml, F.RegularStateReview.status)
  @name("StateReview")
  stateReview: string;

  @Mapping.from(grantsGovXml, F.RegularStateReview.availableDate)
  @name("StateReviewAvailableDate")
  stateReviewAvailableDate?: plainDate;

  @Mapping.from(grantsGovXml, F.RegularDebt.isDelinquent)
  @Mapping.transform(Mappings.Transforms.Transformation.booleanToYesNo)
  @name("DelinquentFederalDebt")
  delinquentFederalDebt: string;

  @Mapping.from(grantsGovXml, F.RegularDebt.explanation)
  @name("DebtExplanation")
  debtExplanation?: XSD.Att.AttachedFileDataType;

  @Mapping.from(grantsGovXml, F.RegularCertification.agree)
  @Mapping.transform(Mappings.Transforms.Transformation.booleanToYesNo)
  @name("CertificationAgree")
  certificationAgree: string;

  @Mapping.from(grantsGovXml, F.RegularRepresentative.name)
  @name("AuthorizedRepresentative")
  authorizedRepresentative: XSD.GlobLib.HumanNameDataType;

  @Mapping.from(grantsGovXml, F.RegularRepresentative.title)
  @name("AuthorizedRepresentativeTitle")
  authorizedRepresentativeTitle: string;

  @Mapping.from(grantsGovXml, F.RegularRepresentative.phone)
  @name("AuthorizedRepresentativePhoneNumber")
  authorizedRepresentativePhoneNumber: string;

  @Mapping.from(grantsGovXml, F.RegularRepresentative.email)
  @name("AuthorizedRepresentativeEmail")
  authorizedRepresentativeEmail: string;

  @Mapping.from(grantsGovXml, F.RegularRepresentative.fax)
  @name("AuthorizedRepresentativeFax")
  authorizedRepresentativeFax?: string;

  @Mapping.from(grantsGovXml, F.RegularRepresentative.signature)
  @name("AORSignature")
  aORSignature: string;

  @Mapping.from(grantsGovXml, F.RegularRepresentative.dateSigned)
  @name("DateSigned")
  dateSigned: plainDate;

  @attribute @name("FormVersion") formVersion: "4.0";
}

@ns(Namespaces.att)
model AdditionalProjectTitle {
  @Mapping.from(grantsGovXml, F.RegularProject.additionalProjectTitle)
  @maxItems(100)
  @name("AttachedFile")
  attachedFile: XSD.Att.AttachedFileDataType[];
}

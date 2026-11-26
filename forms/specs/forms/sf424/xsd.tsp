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
namespace XSD.SF424Regular40;

alias grantsGovXml = Mappings.Target.grantsGovXml;
alias F = Forms.SF424Regular;
alias Transformation = Mappings.Transforms.Transformation;

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
  @Mapping.from(grantsGovXml, F.SF424Application.submissionType)
  @name("SubmissionType")
  submissionType: string;

  @Mapping.from(grantsGovXml, F.SF424Application.applicationType)
  @name("ApplicationType")
  applicationType: string;

  @Mapping.from(grantsGovXml, F.SF424Revision.type)
  @name("RevisionType")
  revisionType?: string;

  @Mapping.from(grantsGovXml, F.SF424Revision.otherSpecify)
  @name("RevisionOtherSpecify")
  revisionOtherSpecify?: string;

  @Mapping.from(grantsGovXml, F.SF424Application.dateReceived)
  @name("DateReceived")
  dateReceived: plainDate;

  @Mapping.from(grantsGovXml, F.SF424Application.applicantId)
  @name("ApplicantID")
  applicantID?: string;

  @Mapping.from(grantsGovXml, F.SF424Application.federalEntityIdentifier)
  @name("FederalEntityIdentifier")
  federalEntityIdentifier?: string;

  @Mapping.from(grantsGovXml, F.SF424Application.federalAwardIdentifier)
  @name("FederalAwardIdentifier")
  federalAwardIdentifier?: string;

  @Mapping.from(grantsGovXml, F.SF424StateApplication.receivedDate)
  @name("StateReceiveDate")
  stateReceiveDate?: plainDate;

  @Mapping.from(grantsGovXml, F.SF424StateApplication.applicationId)
  @name("StateApplicationID")
  stateApplicationID?: string;

  @Mapping.from(grantsGovXml, F.SF424ApplicantOrganization.name)
  @name("OrganizationName")
  organizationName: string;

  @Mapping.from(grantsGovXml, F.SF424ApplicantOrganization.ein)
  @name("EmployerTaxpayerIdentificationNumber")
  employerTaxpayerIdentificationNumber: string;

  @Mapping.from(grantsGovXml, F.SF424ApplicantOrganization.uei)
  @name("SAMUEI")
  sAMUEI: string;

  @Mapping.from(grantsGovXml, F.SF424ApplicantOrganization.address)
  @name("Applicant")
  applicant: XSD.GlobLib.AddressDataTypeV3;

  @Mapping.from(grantsGovXml, F.SF424ApplicantOrganization.department)
  @name("DepartmentName")
  departmentName?: string;

  @Mapping.from(grantsGovXml, F.SF424ApplicantOrganization.division)
  @name("DivisionName")
  divisionName?: string;

  @Mapping.from(grantsGovXml, F.SF424PointOfContact.name)
  @name("ContactPerson")
  contactPerson?: XSD.GlobLib.HumanNameDataType;

  @Mapping.from(grantsGovXml, F.SF424PointOfContact.title)
  @name("Title")
  title?: string;

  @Mapping.from(grantsGovXml, F.SF424ContactOrganization.name)
  @name("OrganizationAffiliation")
  organizationAffiliation?: string;

  @Mapping.from(grantsGovXml, F.SF424PointOfContact.phone)
  @name("PhoneNumber")
  phoneNumber: string;

  @Mapping.from(grantsGovXml, F.SF424PointOfContact.fax)
  @name("Fax")
  fax?: string;

  @Mapping.from(grantsGovXml, F.SF424PointOfContact.email)
  @name("Email")
  email: string;

  @Mapping.from(grantsGovXml, Mapping.Item<F.SF424ApplicantType.codes, 0>)
  @name("ApplicantTypeCode1")
  applicantTypeCode1: string;

  @Mapping.from(grantsGovXml, Mapping.Item<F.SF424ApplicantType.codes, 1>)
  @name("ApplicantTypeCode2")
  applicantTypeCode2?: string;

  @Mapping.from(grantsGovXml, Mapping.Item<F.SF424ApplicantType.codes, 2>)
  @name("ApplicantTypeCode3")
  applicantTypeCode3?: string;

  @Mapping.from(grantsGovXml, F.SF424ApplicantType.otherSpecify)
  @name("ApplicantTypeOtherSpecify")
  applicantTypeOtherSpecify?: string;

  @Mapping.from(grantsGovXml, F.SF424Opportunity.agencyName)
  @name("AgencyName")
  agencyName: string;

  @Mapping.from(grantsGovXml, Questions.Opportunities.AssistanceListing.number)
  @name("CFDANumber")
  cFDANumber?: string;

  @Mapping.from(grantsGovXml, Questions.Opportunities.AssistanceListing.title)
  @name("CFDAProgramTitle")
  cFDAProgramTitle?: string;

  @Mapping.from(grantsGovXml, F.SF424Opportunity.number)
  @name("FundingOpportunityNumber")
  fundingOpportunityNumber: string;

  @Mapping.from(grantsGovXml, F.SF424Opportunity.title)
  @name("FundingOpportunityTitle")
  fundingOpportunityTitle: string;

  @Mapping.from(grantsGovXml, F.SF424Competition.number)
  @name("CompetitionIdentificationNumber")
  competitionIdentificationNumber?: string;

  @Mapping.from(grantsGovXml, F.SF424Competition.title)
  @name("CompetitionIdentificationTitle")
  competitionIdentificationTitle?: string;

  @Mapping.from(grantsGovXml, F.SF424Project.areasAffected)
  @name("AreasAffected")
  areasAffected?: XSD.Att.AttachedFileDataType;

  @Mapping.from(grantsGovXml, F.SF424Project.title)
  @name("ProjectTitle")
  projectTitle: string;

  @name("AdditionalProjectTitle")
  additionalProjectTitle?: AdditionalProjectTitle;

  @Mapping.from(grantsGovXml, F.SF424Applicant.congressionalDistrict)
  @name("CongressionalDistrictApplicant")
  congressionalDistrictApplicant: string;

  @Mapping.from(grantsGovXml, F.SF424Project.congressionalDistrict)
  @name("CongressionalDistrictProgramProject")
  congressionalDistrictProgramProject: string;

  @Mapping.from(grantsGovXml, F.SF424Project.additionalCongressionalDistricts)
  @name("AdditionalCongressionalDistricts")
  additionalCongressionalDistricts?: XSD.Att.AttachedFileDataType;

  @Mapping.from(grantsGovXml, F.SF424ProjectTimeline.startDate)
  @name("ProjectStartDate")
  projectStartDate: plainDate;

  @Mapping.from(grantsGovXml, F.SF424ProjectTimeline.endDate)
  @name("ProjectEndDate")
  projectEndDate: plainDate;

  @Mapping.from(grantsGovXml, F.SF424FundingSources.federal)
  @Mapping.transform(Transformation.currencyFormat)
  @name("FederalEstimatedFunding")
  federalEstimatedFunding: string;

  @Mapping.from(grantsGovXml, F.SF424FundingSources.applicant)
  @Mapping.transform(Transformation.currencyFormat)
  @name("ApplicantEstimatedFunding")
  applicantEstimatedFunding: string;

  @Mapping.from(grantsGovXml, F.SF424FundingSources.state)
  @Mapping.transform(Transformation.currencyFormat)
  @name("StateEstimatedFunding")
  stateEstimatedFunding: string;

  @Mapping.from(grantsGovXml, F.SF424FundingSources.local)
  @Mapping.transform(Transformation.currencyFormat)
  @name("LocalEstimatedFunding")
  localEstimatedFunding: string;

  @Mapping.from(grantsGovXml, F.SF424FundingSources.other)
  @Mapping.transform(Transformation.currencyFormat)
  @name("OtherEstimatedFunding")
  otherEstimatedFunding: string;

  @Mapping.from(grantsGovXml, F.SF424FundingSources.programIncome)
  @Mapping.transform(Transformation.currencyFormat)
  @name("ProgramIncomeEstimatedFunding")
  programIncomeEstimatedFunding: string;

  @Mapping.from(grantsGovXml, F.SF424FundingSources.total)
  @Mapping.transform(Transformation.currencyFormat)
  @name("TotalEstimatedFunding")
  totalEstimatedFunding: string;

  @Mapping.from(grantsGovXml, F.SF424StateReview.status)
  @name("StateReview")
  stateReview: string;

  @Mapping.from(grantsGovXml, F.SF424StateReview.date)
  @name("StateReviewAvailableDate")
  stateReviewAvailableDate?: plainDate;

  @Mapping.from(grantsGovXml, F.SF424DelinquentFederalDebt.answer)
  @Mapping.transform(Transformation.booleanToYesNo)
  @name("DelinquentFederalDebt")
  delinquentFederalDebt: string;

  @Mapping.from(grantsGovXml, F.SF424DelinquentFederalDebt.explanation)
  @name("DebtExplanation")
  debtExplanation?: XSD.Att.AttachedFileDataType;

  @Mapping.from(grantsGovXml, Questions.Certifications.Certification.agree)
  @Mapping.transform(Transformation.booleanToYesNo)
  @name("CertificationAgree")
  certificationAgree: string;

  @Mapping.from(grantsGovXml, F.SF424AuthorizedRepresentative.name)
  @name("AuthorizedRepresentative")
  authorizedRepresentative: XSD.GlobLib.HumanNameDataType;

  @Mapping.from(grantsGovXml, F.SF424AuthorizedRepresentative.title)
  @name("AuthorizedRepresentativeTitle")
  authorizedRepresentativeTitle: string;

  @Mapping.from(grantsGovXml, F.SF424AuthorizedRepresentative.phone)
  @name("AuthorizedRepresentativePhoneNumber")
  authorizedRepresentativePhoneNumber: string;

  @Mapping.from(grantsGovXml, F.SF424AuthorizedRepresentative.email)
  @name("AuthorizedRepresentativeEmail")
  authorizedRepresentativeEmail: string;

  @Mapping.from(grantsGovXml, F.SF424AuthorizedRepresentative.fax)
  @name("AuthorizedRepresentativeFax")
  authorizedRepresentativeFax?: string;

  @Mapping.from(grantsGovXml, Questions.Certifications.Certification.signature)
  @name("AORSignature")
  aORSignature: string;

  @Mapping.from(grantsGovXml, Questions.Certifications.Certification.dateSigned)
  @name("DateSigned")
  dateSigned: plainDate;

  @attribute @name("FormVersion") formVersion: "4.0";
}

@ns(Namespaces.att)
model AdditionalProjectTitle {
  @Mapping.from(grantsGovXml, F.SF424Project.additionalTitles)
  @maxItems(100)
  @name("AttachedFile")
  attachedFile: XSD.Att.AttachedFileDataType[];
}

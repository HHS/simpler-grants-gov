import "@typespec/xml";
import "form-library-xml";
import "simpler-forms";
import "#mapping/targets.tsp";
import "#mapping/transforms.tsp";
import "#xsd/global-library.tsp";
import "./form.tsp";

using TypeSpec.Xml;
using SimplerForms;

/** SF424_Short_3_0-V3.0.xsd */
namespace XSD.SF424Short30;
alias grantsGovXml = Mappings.Target.grantsGovXml;
alias Transformation = Mappings.Transforms.Transformation;
alias Form = Forms.SF424Short.SF424Short;
alias GlobLib = XSD.GlobLib;

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
  @Mapping.from(grantsGovXml, Forms.SF424Short.ShortOpportunity.agencyName)
  @name("AgencyName")
  agencyName: string;

  @Mapping.from(
    grantsGovXml,
    Forms.SF424Short.ShortOpportunity.assistanceListingNumber
  )
  @name("CFDANumber")
  assistanceListingNumber?: string;

  @Mapping.from(
    grantsGovXml,
    Forms.SF424Short.ShortOpportunity.assistanceListingProgramTitle
  )
  @name("CFDAProgramTitle")
  assistanceListingProgramTitle?: string;

  @Mapping.from(grantsGovXml, Form.dateReceived)
  @name("DateReceived")
  dateReceived: plainDate;

  @Mapping.from(
    grantsGovXml,
    Forms.SF424Short.ShortOpportunity.fundingOpportunityNumber
  )
  @name("FundingOpportunityNumber")
  fundingOpportunityNumber: string;

  @Mapping.from(
    grantsGovXml,
    Forms.SF424Short.ShortOpportunity.fundingOpportunityTitle
  )
  @name("FundingOpportunityTitle")
  fundingOpportunityTitle: string;

  @Mapping.from(grantsGovXml, Forms.SF424Short.ShortApplicant.organizationName)
  @name("OrganizationName")
  organizationName: string;

  @Mapping.from(grantsGovXml, Forms.SF424Short.ShortApplicant.address)
  @name("Address")
  applicant: GlobLib.AddressDataTypeV3;

  @Mapping.from(
    grantsGovXml,
    Forms.SF424Short.ShortApplicant.applicantWebAddress
  )
  @name("ApplicantWebAddress")
  applicantWebAddress?: url;

  // The existing API fans one applicant-type array into these three named elements,
  // with a per-item casing transform. Mapping.from cannot express that operation yet.
  @name("ApplicantTypeCode1") applicantTypeCode1: string;

  @name("ApplicantTypeCode2") applicantTypeCode2?: string;
  @name("ApplicantTypeCode3") applicantTypeCode3?: string;

  @Mapping.from(
    grantsGovXml,
    Forms.SF424Short.ShortApplicant.applicantTypeOtherSpecify
  )
  @name("ApplicantTypeOtherSpecify")
  applicantTypeOtherSpecify?: string;

  @Mapping.from(
    grantsGovXml,
    Forms.SF424Short.ShortApplicant.employerTaxpayerIdentificationNumber
  )
  @name("EmployerTaxpayerIdentificationNumber")
  employerTaxpayerIdentificationNumber: string;

  @Mapping.from(grantsGovXml, Forms.SF424Short.ShortApplicant.samUei)
  @name("SAMUEI")
  samUei: string;

  @Mapping.from(
    grantsGovXml,
    Forms.SF424Short.ShortApplicant.congressionalDistrictApplicant
  )
  @name("CongressionalDistrictApplicant")
  congressionalDistrictApplicant: string;

  @Mapping.from(grantsGovXml, Forms.SF424Short.ShortProject.title)
  @name("ProjectTitle")
  projectTitle: string;

  @Mapping.from(grantsGovXml, Forms.SF424Short.ShortProject.description)
  @name("ProjectDescription")
  projectDescription: string;

  @Mapping.from(grantsGovXml, Forms.SF424Short.ShortProject.startDate)
  @name("ProjectStartDate")
  projectStartDate: plainDate;

  @Mapping.from(grantsGovXml, Forms.SF424Short.ShortProject.endDate)
  @name("ProjectEndDate")
  projectEndDate: plainDate;

  @Mapping.from(grantsGovXml, Form.projectDirector)
  @name("ProjectDirectorGroup")
  projectDirector: GlobLib.ContactPersonDataTypeV3;

  @Mapping.from(grantsGovXml, Form.sameAsProjectDirector)
  @Mapping.transform(Transformation.booleanToYesNo)
  @name("SameAsProjectDirector")
  sameAsProjectDirector?: string;

  @Mapping.from(grantsGovXml, Form.contactPerson)
  @name("ContactPersonGroup")
  contactPerson?: GlobLib.ContactPersonDataTypeV3;

  @Mapping.from(grantsGovXml, Form.applicationCertification)
  @Mapping.transform(Transformation.booleanToYesNo)
  @name("ApplicationCertification")
  applicationCertification: string;

  @Mapping.from(grantsGovXml, Forms.SF424Short.ShortRepresentative.name)
  @name("AuthorizedRepresentative")
  authorizedRepresentative: GlobLib.HumanNameDataType;

  @Mapping.from(grantsGovXml, Forms.SF424Short.ShortRepresentative.title)
  @name("AuthorizedRepresentativeTitle")
  authorizedRepresentativeTitle: string;

  @Mapping.from(grantsGovXml, Forms.SF424Short.ShortRepresentative.email)
  @name("AuthorizedRepresentativeEmail")
  authorizedRepresentativeEmail: string;

  @Mapping.from(grantsGovXml, Forms.SF424Short.ShortRepresentative.phone)
  @name("AuthorizedRepresentativePhoneNumber")
  authorizedRepresentativePhoneNumber: string;

  @Mapping.from(grantsGovXml, Forms.SF424Short.ShortRepresentative.fax)
  @name("AuthorizedRepresentativeFaxNumber")
  authorizedRepresentativeFax?: string;

  @Mapping.from(grantsGovXml, Forms.SF424Short.ShortRepresentative.signature)
  @name("AuthorizedRepresentativeSignature")
  aorSignature: string;

  @Mapping.from(grantsGovXml, Forms.SF424Short.ShortRepresentative.dateSigned)
  @name("AuthorizedRepresentativeDateSigned")
  authorizedRepresentativeDateSigned: plainDate;

  @attribute @name("FormVersion") formVersion: "3.0";
}

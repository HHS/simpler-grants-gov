import "@typespec/xml";
import "form-library-xml";
import "simpler-forms";

import "#mapping/targets.tsp";
import "#mapping/transforms.tsp";
import "#xsd/global-library.tsp";

import "./form.tsp";

using TypeSpec.Xml;
using SimplerForms;

/** SF424_Individual_2_0-V2.0.xsd */
namespace XSD.SF424Individual20;

alias grantsGovXml = Mappings.Target.grantsGovXml;
alias Transformation = Mappings.Transforms.Transformation;
alias SF424Individual = Forms.SF424Individual.SF424Individual;
alias Opportunity = Forms.SF424Individual.SF424IndividualOpportunity;
alias AssistanceListing = Questions.Opportunities.AssistanceListing;
alias Application = Forms.SF424Individual.SF424IndividualApplication;
alias Applicant = Forms.SF424Individual.SF424IndividualApplicant;
alias Citizenship = Forms.SF424Individual.SF424IndividualCitizenship;
alias Project = Forms.SF424Individual.SF424IndividualProject;
alias Timeline = Forms.SF424Individual.SF424IndividualProjectTimeline;
alias PointOfContact = Forms.SF424Individual.SF424IndividualPointOfContact;
alias Certification = Questions.Certifications.Certification;
alias GlobLib = XSD.GlobLib;

// =============================================================================
// ROOT ELEMENT
// =============================================================================

@nsDeclarations
enum Namespaces {
  SF424_Individual_2_0: "http://apply.grants.gov/forms/SF424_Individual_2_0-V2.0",
  globLib: "http://apply.grants.gov/system/GlobalLibrary-V2.0",
  codes: "http://apply.grants.gov/system/UniversalCodes-V2.0",
}

@name("SF424_Individual_2_0")
@ns(Namespaces.SF424_Individual_2_0)
@GrantsGov.xsd("https://apply07.grants.gov/apply/forms/schemas/SF424_Individual_2_0-V2.0.xsd")
@Mapping.from(grantsGovXml, SF424Individual)
model Root {
  @Mapping.from(grantsGovXml, Opportunity.agencyName)
  @name("FederalAgency")
  federalAgency: string;

  @Mapping.from(grantsGovXml, AssistanceListing.number)
  @name("CFDANumber")
  cfdaNumber?: string;

  @Mapping.from(grantsGovXml, AssistanceListing.title)
  @name("CFDATitle")
  cfdaTitle?: string;

  @Mapping.from(grantsGovXml, Application.dateReceived)
  @name("Date_Received")
  dateReceived: plainDate;

  @Mapping.from(grantsGovXml, Opportunity.number)
  @name("OpportunityID")
  opportunityId: string;

  @Mapping.from(grantsGovXml, Opportunity.title)
  @name("OpportunityTitle")
  opportunityTitle: string;

  @Mapping.from(grantsGovXml, PointOfContact.name)
  @name("AuthorizedRepresentativeName")
  name: GlobLib.HumanNameDataType;

  @Mapping.from(grantsGovXml, PointOfContact.fax)
  @name("AuthorizedRepresentativeFax")
  fax?: string;

  @Mapping.from(grantsGovXml, PointOfContact.email)
  @name("AuthorizedRepresentativeEmail")
  email: string;

  @Mapping.from(grantsGovXml, PointOfContact.phone)
  @name("AuthorizedRepresentativePhoneNumber")
  phone: string;

  @Mapping.from(grantsGovXml, PointOfContact.eveningPhone)
  @name("EveningPhone")
  eveningPhone?: string;

  @Mapping.from(grantsGovXml, PointOfContact.address)
  @name("AuthorizedRepresentativeAddress")
  address: GlobLib.AddressDataTypeV3;

  @Mapping.from(grantsGovXml, Citizenship.isUsCitizen)
  @Mapping.transform(Transformation.booleanToYesNo)
  @name("citizenship")
  citizenship: string;

  @Mapping.from(grantsGovXml, Citizenship.alienRegistrationNumber)
  @name("AlienRegistrationNumber")
  alienNumber?: string;

  @Mapping.from(grantsGovXml, Citizenship.country)
  @name("CountryofOrigin")
  country?: string;

  @Mapping.from(grantsGovXml, Citizenship.residencyStartDate)
  @name("VisitDate")
  visitDate?: plainDate;

  @Mapping.from(grantsGovXml, Applicant.congressionalDistrict)
  @name("CongressionalDistrictApplicant")
  district: string;

  @Mapping.from(grantsGovXml, Project.title)
  @name("ProjectTitle")
  title: string;

  @Mapping.from(grantsGovXml, Project.description)
  @name("ProjectDescription")
  description: string;

  @Mapping.from(grantsGovXml, Timeline.startDate)
  @name("FundingPeriodStartDate")
  startDate: plainDate;

  @Mapping.from(grantsGovXml, Timeline.endDate)
  @name("FundingPeriodEndDate")
  endDate: plainDate;

  @Mapping.from(grantsGovXml, Certification.agree)
  @Mapping.transform(Transformation.booleanToYesNo)
  @name("ApplicationCertification")
  agree: string;

  @Mapping.from(grantsGovXml, Certification.signature)
  @name("AORSignature")
  signature: string;

  @Mapping.from(grantsGovXml, Certification.dateSigned)
  @name("AORDate")
  dateSigned: plainDate;

  @attribute @name("FormVersion") formVersion: "2.0";
}

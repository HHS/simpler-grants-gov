import "@typespec/xml";
import "form-library-xml";
import "#xsd/attachments.tsp";
import "simpler-forms";
import "#mapping/targets.tsp";
import "#mapping/transforms.tsp";
import "./form.tsp";
using SimplerForms;
using TypeSpec.Xml;
namespace XSD.SbirSttrInformation;
alias Form = Forms.SbirSttrInformation.Form;
alias target = Mappings.Target.grantsGovXml;
alias Transform = Mappings.Transforms.Transformation;
@nsDeclarations
enum Namespaces {
  sbir: "http://apply.grants.gov/forms/SBIR_STTR_Information_3_0-V3.0",
  att: "http://apply.grants.gov/system/Attachments-V1.0",
}
@ns(Namespaces.sbir)
@name("SBIR_STTR_Information_3_0")
@Mapping.from(target, Form)
@GrantsGov.xsd("https://apply07.grants.gov/apply/forms/schemas/SBIR_STTR_Information_3_0-V3.0.xsd")
model SbirSttrInformation {
  @attribute
  @ns(Namespaces.sbir)
  @name("FormVersion")
  formVersion: "3.0";

  @name("Agency")
  @Mapping.from(target, Form.agency)
  agency: string;

  @name("OtherAgency")
  @Mapping.from(target, Form.otherAgency)
  @Mapping.when(Form.agency, Operator.equals, "Other")
  otherAgency?: string;

  @name("SBCControlID")
  @Mapping.from(target, Form.sbcControlId)
  sbcControlId: string;

  @name("ProgramType")
  @Mapping.from(target, Form.programType)
  programType: string;

  @name("ApplicationType")
  @Mapping.from(target, Form.applicationType)
  applicationType: string;

  @name("PhaseILetterofIntentNumber")
  @Mapping.from(target, Form.phaseILetterOfIntentNumber)
  phaseILetterOfIntentNumber?: string;

  @name("AgencyTopicSubtopic")
  @Mapping.from(target, Form.agencyTopicSubtopic)
  agencyTopicSubtopic?: string;

  @name("SmallBusinessEligibility")
  @Mapping.from(target, Form.eligibilityCertification)
  @Mapping.transform(Transform.booleanToYesNo)
  eligibilityCertification: string;

  @name("NumberOfEmployees")
  @Mapping.from(target, Form.anticipatedPersonnel)
  anticipatedPersonnel: integer;

  @name("VCOC")
  @Mapping.from(target, Form.majorityVentureCapitalOwned)
  @Mapping.transform(Transform.booleanToYesNo)
  majorityVentureCapitalOwned: string;

  @name("FacultyStudentOwned")
  @Mapping.from(target, Form.facultyOrStudentOwned)
  @Mapping.transform(Transform.booleanToYesNo)
  facultyOrStudentOwned: string;

  @name("SubcontractsIncluded")
  @Mapping.from(target, Form.federalSubcontractsIncluded)
  @Mapping.transform(Transform.booleanToYesNo)
  federalSubcontractsIncluded: string;

  @name("SubcontractorNames")
  @Mapping.from(target, Form.laboratoryOrAgencyNames)
  @Mapping.when(Form.federalSubcontractsIncluded, Operator.equals, true)
  laboratoryOrAgencyNames?: string;

  @name("LocatedInHUBZone")
  @Mapping.from(target, Form.hubZoneLocated)
  @Mapping.transform(Transform.booleanToYesNo)
  hubZoneLocated: string;

  @name("DomesticPerformance")
  @Mapping.from(target, Form.researchEntirelyInUnitedStates)
  @Mapping.transform(Transform.booleanToYesNo)
  researchEntirelyInUnitedStates: string;

  @name("NonDomesticPerformanceExplanation")
  @Mapping.from(target, Form.outsideUnitedStatesExplanation)
  @Mapping.when(Form.researchEntirelyInUnitedStates, Operator.equals, false)
  outsideUnitedStatesExplanation?: XSD.Att.AttachedFileDataType;

  @name("EquivalentProposalsSubmitted")
  @Mapping.from(target, Form.equivalentFederalWork)
  @Mapping.transform(Transform.booleanToYesNo)
  equivalentFederalWork: string;

  @name("EquivalentProposalRecipients")
  @Mapping.from(target, Form.equivalentWorkAgencies)
  @Mapping.when(Form.equivalentFederalWork, Operator.equals, true)
  equivalentWorkAgencies?: string;

  @name("DisclosurePermission")
  @Mapping.from(target, Form.disclosurePermitted)
  @Mapping.transform(Transform.booleanToYesNo)
  disclosurePermitted: string;

  @name("TABARequest")
  @Mapping.from(target, Form.tabaFundsRequested)
  @Mapping.transform(Transform.booleanToYesNo)
  tabaFundsRequested: string;

  @name("CommercializationPlan")
  @Mapping.from(target, Form.commercializationPlan)
  commercializationPlan?: XSD.Att.AttachedFileDataType;

  @name("SBIR_PhaseIIAwardsReceived")
  @Mapping.from(target, Form.phaseIIAwardsReceived)
  @Mapping.when(Form.programType, Operator.in, #["SBIR", "Both"])
  @Mapping.transform(Transform.booleanToYesNo)
  phaseIIAwardsReceived?: string;

  @name("SBIR_CommercializationHistory")
  @Mapping.from(target, Form.commercializationHistory)
  @Mapping.when(Form.phaseIIAwardsReceived, Operator.equals, true)
  @Mapping.when(Form.programType, Operator.in, #["SBIR", "Both"])
  commercializationHistory?: XSD.Att.AttachedFileDataType;

  @name("SBIR_PDPIPrimarilyEmployed")
  @Mapping.from(target, Form.principalInvestigatorPrimaryEmployment)
  @Mapping.when(Form.programType, Operator.in, #["SBIR", "Both"])
  @Mapping.transform(Transform.booleanToYesNo)
  principalInvestigatorPrimaryEmployment?: string;

  @name("STTR_PDPICommitment")
  @Mapping.from(target, Form.appointmentAndMinimumEffortCertified)
  @Mapping.when(Form.programType, Operator.in, #["STTR", "Both"])
  @Mapping.transform(Transform.booleanToYesNo)
  appointmentAndMinimumEffortCertified?: string;

  @name("STTR_JointPerformancePercentage")
  @Mapping.from(target, Form.smallBusinessAndInstitutionWorkSharesCertified)
  @Mapping.when(Form.programType, Operator.in, #["STTR", "Both"])
  @Mapping.transform(Transform.booleanToYesNo)
  smallBusinessAndInstitutionWorkSharesCertified?: string;

  @name("SAMUEI")
  @Mapping.from(target, Form.researchPartnerUei)
  @Mapping.when(Form.programType, Operator.in, #["STTR", "Both"])
  researchPartnerUei?: string;
}

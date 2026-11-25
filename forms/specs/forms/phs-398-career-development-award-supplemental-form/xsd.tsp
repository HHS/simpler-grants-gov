import "@typespec/xml";
import "form-library-xml";
import "simpler-forms";
import "#mapping/targets.tsp";
import "#mapping/transforms.tsp";
import "#xsd/attachments.tsp";
import "./form.tsp";

using TypeSpec.Xml;
using SimplerForms;

namespace XSD.Phs398CareerDevelopmentAwardSupplemental;

alias grantsGovXml = Mappings.Target.grantsGovXml;
alias Transformation = Mappings.Transforms.Transformation;
alias Form = Forms.Phs398CareerDevelopmentAwardSupplemental.Form;

@nsDeclarations
enum Namespaces {
  PHS398_CareerDevelopmentAwardSup_6_0: "http://apply.grants.gov/forms/PHS398_CareerDevelopmentAwardSup_6_0-V6.0",
  att: "http://apply.grants.gov/system/Attachments-V1.0",
}

@name("PHS398_CareerDevelopmentAwardSup_6_0")
@ns(Namespaces.PHS398_CareerDevelopmentAwardSup_6_0)
@GrantsGov.xsd("https://apply07.grants.gov/apply/forms/schemas/PHS398_CareerDevelopmentAwardSup_6_0-V6.0.xsd")
@Mapping.from(grantsGovXml, Form)
model Root {
  @name("CareerDevelopmentAwardAttachments")
  careerDevelopmentAwardAttachments?: Attachments;

  @name("CitizenshipIndicator")
  @Mapping.from(grantsGovXml, Form.isUsCitizenOrNational)
  @Mapping.transform(Transformation.booleanToYesNo)
  citizenshipIndicator: string;

  @Mapping.when(Form.isUsCitizenOrNational, Operator.equals, false)
  @name("isNonUSCitizenship")
  @Mapping.from(grantsGovXml, Form.nonUsCitizenshipStatus)
  nonUsCitizenship?: string;

  @Mapping.when(Form.isUsCitizenOrNational, Operator.equals, false)
  @Mapping.when(
    Form.nonUsCitizenshipStatus,
    Operator.equals,
    "Temporary U.S. Visa"
  )
  @name("PermanentResidentByAwardIndicator")
  @Mapping.from(grantsGovXml, Form.permanentResidentByAward)
  @Mapping.transform(Transformation.booleanToYesNo)
  permanentResidentByAwardIndicator?: string;

  @attribute @name("FormVersion") formVersion: "6.0";
}

@ns(Namespaces.PHS398_CareerDevelopmentAwardSup_6_0)
model Attachments {
  @name("IntroductionToApplication")
  introductionToApplication?: {
    @ns(Namespaces.PHS398_CareerDevelopmentAwardSup_6_0)
    @name("attFile")
    @Mapping.from(grantsGovXml, Form.introductionToApplication)
    file: XSD.Att.AttachedFileDataType;
  };

  @name("CandidateInformationAndGoals")
  candidateInformationAndGoals?: {
    @ns(Namespaces.PHS398_CareerDevelopmentAwardSup_6_0)
    @name("attFile")
    @Mapping.from(grantsGovXml, Form.candidateInformationAndGoals)
    file: XSD.Att.AttachedFileDataType;
  };

  @name("SpecificAims")
  specificAims?: {
    @ns(Namespaces.PHS398_CareerDevelopmentAwardSup_6_0)
    @name("attFile")
    @Mapping.from(grantsGovXml, Form.specificAims)
    file: XSD.Att.AttachedFileDataType;
  };

  @name("ResearchStrategy")
  researchStrategy: {
    @ns(Namespaces.PHS398_CareerDevelopmentAwardSup_6_0)
    @name("attFile")
    @Mapping.from(grantsGovXml, Form.researchStrategy)
    file: XSD.Att.AttachedFileDataType;
  };

  @name("ProgressReportPublicationList")
  progressReportPublicationList?: {
    @ns(Namespaces.PHS398_CareerDevelopmentAwardSup_6_0)
    @name("attFile")
    @Mapping.from(grantsGovXml, Form.progressReportPublicationList)
    file: XSD.Att.AttachedFileDataType;
  };

  @name("ResponsibleConductOfResearch")
  responsibleConductOfResearch?: {
    @ns(Namespaces.PHS398_CareerDevelopmentAwardSup_6_0)
    @name("attFile")
    @Mapping.from(grantsGovXml, Form.responsibleConductOfResearch)
    file: XSD.Att.AttachedFileDataType;
  };

  @name("MentoringPlan")
  mentoringPlan?: {
    @ns(Namespaces.PHS398_CareerDevelopmentAwardSup_6_0)
    @name("attFile")
    @Mapping.from(grantsGovXml, Form.mentoringPlan)
    file: XSD.Att.AttachedFileDataType;
  };

  @name("StatementsOfSupport")
  statementsOfSupport?: {
    @ns(Namespaces.PHS398_CareerDevelopmentAwardSup_6_0)
    @name("attFile")
    @Mapping.from(grantsGovXml, Form.statementsOfSupport)
    file: XSD.Att.AttachedFileDataType;
  };

  @name("LettersOfSupport")
  lettersOfSupport?: {
    @ns(Namespaces.PHS398_CareerDevelopmentAwardSup_6_0)
    @name("attFile")
    @Mapping.from(grantsGovXml, Form.lettersOfSupport)
    file: XSD.Att.AttachedFileDataType;
  };

  // The wire element keeps the spelling in the original XSD.
  @name("InsitutionalEnvironment")
  institutionalEnvironment?: {
    @ns(Namespaces.PHS398_CareerDevelopmentAwardSup_6_0)
    @name("attFile")
    @Mapping.from(grantsGovXml, Form.institutionalEnvironment)
    file: XSD.Att.AttachedFileDataType;
  };

  @name("InstitutionalCommitment")
  institutionalCommitment?: {
    @ns(Namespaces.PHS398_CareerDevelopmentAwardSup_6_0)
    @name("attFile")
    @Mapping.from(grantsGovXml, Form.institutionalCommitment)
    file: XSD.Att.AttachedFileDataType;
  };

  @name("CandidatesContribution")
  candidatesContribution?: {
    @ns(Namespaces.PHS398_CareerDevelopmentAwardSup_6_0)
    @name("attFile")
    @Mapping.from(grantsGovXml, Form.candidatesContribution)
    file: XSD.Att.AttachedFileDataType;
  };

  @name("VertebrateAnimals")
  vertebrateAnimals?: {
    @ns(Namespaces.PHS398_CareerDevelopmentAwardSup_6_0)
    @name("attFile")
    @Mapping.from(grantsGovXml, Form.vertebrateAnimals)
    file: XSD.Att.AttachedFileDataType;
  };

  @name("SelectAgentResearch")
  selectAgentResearch?: {
    @ns(Namespaces.PHS398_CareerDevelopmentAwardSup_6_0)
    @name("attFile")
    @Mapping.from(grantsGovXml, Form.selectAgentResearch)
    file: XSD.Att.AttachedFileDataType;
  };

  @name("ConsortiumContractualArrangements")
  consortiumContractualArrangements?: {
    @ns(Namespaces.PHS398_CareerDevelopmentAwardSup_6_0)
    @name("attFile")
    @Mapping.from(grantsGovXml, Form.consortiumContractualArrangements)
    file: XSD.Att.AttachedFileDataType;
  };

  @name("ResourceSharingPlans")
  resourceSharingPlans?: {
    @ns(Namespaces.PHS398_CareerDevelopmentAwardSup_6_0)
    @name("attFile")
    @Mapping.from(grantsGovXml, Form.resourceSharingPlans)
    file: XSD.Att.AttachedFileDataType;
  };

  @name("OtherPlans")
  otherPlans?: {
    @ns(Namespaces.PHS398_CareerDevelopmentAwardSup_6_0)
    @name("attFile")
    @Mapping.from(grantsGovXml, Form.otherPlans)
    file: XSD.Att.AttachedFileDataType;
  };

  @name("KeyBiologicalAndOrChemicalResources")
  keyBiologicalAndOrChemicalResources?: {
    @ns(Namespaces.PHS398_CareerDevelopmentAwardSup_6_0)
    @name("attFile")
    @Mapping.from(grantsGovXml, Form.keyBiologicalAndOrChemicalResources)
    file: XSD.Att.AttachedFileDataType;
  };

  @name("Appendix")
  appendix?: Appendix;
}

@ns(Namespaces.att)
model Appendix {
  @name("AttachedFile")
  @Mapping.from(grantsGovXml, Form.appendix)
  @maxItems(100)
  attachedFile: XSD.Att.AttachedFileDataType[];
}

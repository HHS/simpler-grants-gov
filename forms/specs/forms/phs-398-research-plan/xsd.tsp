import "@typespec/xml";
import "form-library-xml";
import "simpler-forms";
import "#mapping/targets.tsp";
import "#xsd/attachments.tsp";
import "./form.tsp";
using TypeSpec.Xml;
using SimplerForms;
namespace XSD.Phs398ResearchPlan;
alias grantsGovXml = Mappings.Target.grantsGovXml;
alias Form = Forms.Phs398ResearchPlan.Phs398ResearchPlan;
@nsDeclarations
enum Namespaces {
  PHS398_ResearchPlan_5_0: "http://apply.grants.gov/forms/PHS398_ResearchPlan_5_0-V5.0",
  att: "http://apply.grants.gov/system/Attachments-V1.0",
  glob: "http://apply.grants.gov/system/Global-V1.0",
  globLib: "http://apply.grants.gov/system/GlobalLibrary-V2.0",
}
@name("PHS398_ResearchPlan_5_0")
@ns(Namespaces.PHS398_ResearchPlan_5_0)
@GrantsGov.xsd("https://apply07.grants.gov/apply/forms/schemas/PHS398_ResearchPlan_5_0-V5.0.xsd")
@Mapping.from(grantsGovXml, Form)
model Root {
  @name("ResearchPlanAttachments")
  researchPlanAttachments: ResearchPlanAttachments;

  @attribute @name("FormVersion") formVersion: "5.0";
}
@ns(Namespaces.PHS398_ResearchPlan_5_0)
model ResearchPlanAttachments {
  @name("IntroductionToApplication")
  introductionToApplication?: {
    @ns(Namespaces.PHS398_ResearchPlan_5_0)
    @name("attFile")
    @Mapping.from(grantsGovXml, Form.introductionToApplication)
    file: XSD.Att.AttachedFileDataType;
  };

  @name("SpecificAims")
  specificAims?: {
    @ns(Namespaces.PHS398_ResearchPlan_5_0)
    @name("attFile")
    @Mapping.from(grantsGovXml, Form.specificAims)
    file: XSD.Att.AttachedFileDataType;
  };

  @name("ResearchStrategy")
  researchStrategy: {
    @ns(Namespaces.PHS398_ResearchPlan_5_0)
    @name("attFile")
    @Mapping.from(grantsGovXml, Form.researchStrategy)
    file: XSD.Att.AttachedFileDataType;
  };

  @name("ProgressReportPublicationList")
  progressReportPublicationList?: {
    @ns(Namespaces.PHS398_ResearchPlan_5_0)
    @name("attFile")
    @Mapping.from(grantsGovXml, Form.progressReportPublicationList)
    file: XSD.Att.AttachedFileDataType;
  };

  @name("VertebrateAnimals")
  vertebrateAnimals?: {
    @ns(Namespaces.PHS398_ResearchPlan_5_0)
    @name("attFile")
    @Mapping.from(grantsGovXml, Form.vertebrateAnimals)
    file: XSD.Att.AttachedFileDataType;
  };

  @name("SelectAgentResearch")
  selectAgentResearch?: {
    @ns(Namespaces.PHS398_ResearchPlan_5_0)
    @name("attFile")
    @Mapping.from(grantsGovXml, Form.selectAgentResearch)
    file: XSD.Att.AttachedFileDataType;
  };

  @name("MultiplePDPILeadershipPlan")
  multiplePdPiLeadershipPlan?: {
    @ns(Namespaces.PHS398_ResearchPlan_5_0)
    @name("attFile")
    @Mapping.from(grantsGovXml, Form.multiplePdPiLeadershipPlan)
    file: XSD.Att.AttachedFileDataType;
  };

  @name("ConsortiumContractualArrangements")
  consortiumContractualArrangements?: {
    @ns(Namespaces.PHS398_ResearchPlan_5_0)
    @name("attFile")
    @Mapping.from(grantsGovXml, Form.consortiumContractualArrangements)
    file: XSD.Att.AttachedFileDataType;
  };

  @name("LettersOfSupport")
  lettersOfSupport?: {
    @ns(Namespaces.PHS398_ResearchPlan_5_0)
    @name("attFile")
    @Mapping.from(grantsGovXml, Form.lettersOfSupport)
    file: XSD.Att.AttachedFileDataType;
  };

  @name("ResourceSharingPlans")
  resourceSharingPlans?: {
    @ns(Namespaces.PHS398_ResearchPlan_5_0)
    @name("attFile")
    @Mapping.from(grantsGovXml, Form.resourceSharingPlans)
    file: XSD.Att.AttachedFileDataType;
  };

  @name("OtherPlans")
  otherPlans?: {
    @ns(Namespaces.PHS398_ResearchPlan_5_0)
    @name("attFile")
    @Mapping.from(grantsGovXml, Form.otherPlans)
    file: XSD.Att.AttachedFileDataType;
  };

  @name("KeyBiologicalAndOrChemicalResources")
  keyBiologicalAndOrChemicalResources?: {
    @ns(Namespaces.PHS398_ResearchPlan_5_0)
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

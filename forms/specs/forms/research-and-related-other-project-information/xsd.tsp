import "@typespec/xml";
import "form-library-xml";
import "#xsd/attachments.tsp";
import "simpler-forms";
import "#mapping/targets.tsp";
import "#mapping/transforms.tsp";
import "./form.tsp";
using SimplerForms;
using TypeSpec.Xml;
namespace XSD.RROtherProjectInformation14;
alias target = Mappings.Target.grantsGovXml;
alias Transform = Mappings.Transforms.Transformation;
alias Form = Forms.ResearchAndRelatedOtherProjectInformation.ResearchAndRelatedOtherProjectInformation;

@nsDeclarations
enum Namespaces {
  RR_OtherProjectInfo_1_4: "http://apply.grants.gov/forms/RR_OtherProjectInfo_1_4-V1.4",
  globLib: "http://apply.grants.gov/system/GlobalLibrary-V2.0",
  glob: "http://apply.grants.gov/system/Global-V1.0",
  att: "http://apply.grants.gov/system/Attachments-V1.0",
}

enum ExemptionCategory {
  e1: "E1",
  e2: "E2",
  e3: "E3",
  e4: "E4",
  e5: "E5",
  e6: "E6",
  e7: "E7",
  e8: "E8",
}

@ns(Namespaces.RR_OtherProjectInfo_1_4)
model ExemptionNumbers {
  @Mapping.from(target, Form.exemptionNumbers)
  @name("ExemptionNumber")
  @minItems(1)
  @maxItems(8)
  exemptionNumber: ExemptionCategory[];
}

@ns(Namespaces.RR_OtherProjectInfo_1_4)
model HumanSubjectsSupplement {
  @Mapping.from(target, Form.exemptFromFederalRegulations)
  @Mapping.transform(Transform.booleanToYesNo)
  @name("ExemptFedReg")
  exemptFedReg?: string;

  @Mapping.when(Form.exemptFromFederalRegulations, Operator.equals, true)
  @name("ExemptionNumbers")
  exemptionNumbers?: ExemptionNumbers;

  @Mapping.from(target, Form.irbReviewPending)
  @Mapping.transform(Transform.booleanToYesNo)
  @Mapping.when(Form.exemptFromFederalRegulations, Operator.equals, false)
  @name("HumanSubjectIRBReviewIndicator")
  humanSubjectIRBReviewIndicator?: string;

  @Mapping.from(target, Form.irbApprovalDate)
  @Mapping.when(Form.irbReviewPending, Operator.equals, false)
  @Mapping.when(Form.exemptFromFederalRegulations, Operator.equals, false)
  @name("HumanSubjectIRBReviewDate")
  humanSubjectIRBReviewDate?: plainDate;

  @Mapping.from(target, Form.humanSubjectAssuranceNumber)
  @name("HumanSubjectAssuranceNumber")
  @minLength(1)
  @maxLength(10)
  humanSubjectAssuranceNumber?: string;
}

@ns(Namespaces.RR_OtherProjectInfo_1_4)
model VertebrateAnimalsSupplement {
  @Mapping.from(target, Form.iacucReviewPending)
  @Mapping.transform(Transform.booleanToYesNo)
  @name("VertebrateAnimalsIACUCReviewIndicator")
  vertebrateAnimalsIACUCReviewIndicator?: string;

  @Mapping.from(target, Form.iacucApprovalDate)
  @Mapping.when(Form.iacucReviewPending, Operator.equals, false)
  @name("VertebrateAnimalsIACUCApprovalDateReviewDate")
  vertebrateAnimalsIACUCApprovalDateReviewDate?: plainDate;

  @Mapping.from(target, Form.animalWelfareAssuranceNumber)
  @name("AssuranceNumber")
  @minLength(1)
  @maxLength(9)
  assuranceNumber?: string;
}

@ns(Namespaces.RR_OtherProjectInfo_1_4)
model EnvironmentalExemption {
  @Mapping.from(target, Form.assessmentOrExemptionPerformed)
  @Mapping.transform(Transform.booleanToYesNo)
  @name("EnvironmentalExemptionIndicator")
  environmentalExemptionIndicator: string;

  @Mapping.from(target, Form.assessmentOrExemptionExplanation)
  @Mapping.when(Form.assessmentOrExemptionPerformed, Operator.equals, true)
  @name("EnvironmentalExemptionExplanation")
  @minLength(1)
  @maxLength(55)
  environmentalExemptionExplanation?: string;
}

@ns(Namespaces.RR_OtherProjectInfo_1_4)
model EnvironmentalImpact {
  @Mapping.from(target, Form.environmentalImpact)
  @Mapping.transform(Transform.booleanToYesNo)
  @name("EnvironmentalImpactIndicator")
  environmentalImpactIndicator: string;

  @Mapping.from(target, Form.environmentalImpactExplanation)
  @Mapping.when(Form.environmentalImpact, Operator.equals, true)
  @name("EnvironmentalImpactExplanation")
  @minLength(1)
  @maxLength(55)
  environmentalImpactExplanation?: string;

  @Mapping.when(Form.environmentalImpact, Operator.equals, true)
  @name("EnvironmentalExemption")
  environmentalExemption?: EnvironmentalExemption;
}

@ns(Namespaces.RR_OtherProjectInfo_1_4)
model InternationalActivities {
  @Mapping.from(target, Form.internationalActivitiesInvolved)
  @Mapping.transform(Transform.booleanToYesNo)
  @name("InternationalActivitiesIndicator")
  internationalActivitiesIndicator: string;

  @Mapping.from(target, Form.internationalCountries)
  @Mapping.when(Form.internationalActivitiesInvolved, Operator.equals, true)
  @name("ActivitiesPartnershipsCountries")
  @minLength(1)
  @maxLength(55)
  activitiesPartnershipsCountries?: string;

  @Mapping.from(target, Form.internationalActivitiesExplanation)
  @name("InternationalActivitiesExplanation")
  @minLength(1)
  @maxLength(55)
  internationalActivitiesExplanation?: string;
}

@ns(Namespaces.RR_OtherProjectInfo_1_4)
model AbstractAttachments {
  @Mapping.from(target, Form.projectSummaryAbstract)
  @name("AbstractAttachment")
  abstractAttachment: Att.AttachedFileDataType;
}

@ns(Namespaces.RR_OtherProjectInfo_1_4)
model ProjectNarrativeAttachments {
  @Mapping.from(target, Form.projectNarrative)
  @name("ProjectNarrativeAttachment")
  projectNarrativeAttachment: Att.AttachedFileDataType;
}

@ns(Namespaces.RR_OtherProjectInfo_1_4)
model BibliographyAttachments {
  @Mapping.from(target, Form.bibliographyReferencesCited)
  @name("BibliographyAttachment")
  bibliographyAttachment: Att.AttachedFileDataType;
}

@ns(Namespaces.RR_OtherProjectInfo_1_4)
model FacilitiesAttachments {
  @Mapping.from(target, Form.facilitiesOtherResources)
  @name("FacilitiesAttachment")
  facilitiesAttachment: Att.AttachedFileDataType;
}

@ns(Namespaces.RR_OtherProjectInfo_1_4)
model EquipmentAttachments {
  @Mapping.from(target, Form.equipment)
  @name("EquipmentAttachment")
  equipmentAttachment: Att.AttachedFileDataType;
}

@ns(Namespaces.RR_OtherProjectInfo_1_4)
model OtherAttachments {
  @Mapping.from(target, Form.otherAttachments)
  @name("OtherAttachment")
  @minItems(1)
  otherAttachment: Att.AttachedFileDataType[];
}

@ns(Namespaces.RR_OtherProjectInfo_1_4)
@name("RR_OtherProjectInfo_1_4")
@GrantsGov.xsd("https://apply07.grants.gov/apply/forms/schemas/RR_OtherProjectInfo_1_4-V1.4.xsd")
@Mapping.from(target, Form)
model Root {
  @Mapping.from(target, Form.humanSubjectsInvolved)
  @Mapping.transform(Transform.booleanToYesNo)
  @name("HumanSubjectsIndicator")
  humanSubjectsIndicator: string;

  @Mapping.when(Form.humanSubjectsInvolved, Operator.equals, true)
  @name("HumanSubjectsSupplement")
  humanSubjectsSupplement?: HumanSubjectsSupplement;

  @Mapping.from(target, Form.vertebrateAnimalsUsed)
  @Mapping.transform(Transform.booleanToYesNo)
  @name("VertebrateAnimalsIndicator")
  vertebrateAnimalsIndicator: string;

  @Mapping.when(Form.vertebrateAnimalsUsed, Operator.equals, true)
  @name("VertebrateAnimalsSupplement")
  vertebrateAnimalsSupplement?: VertebrateAnimalsSupplement;

  @Mapping.from(target, Form.proprietaryInformationIncluded)
  @Mapping.transform(Transform.booleanToYesNo)
  @name("ProprietaryInformationIndicator")
  proprietaryInformationIndicator: string;

  @name("EnvironmentalImpact")
  environmentalImpact: EnvironmentalImpact;

  @Mapping.from(target, Form.historicSiteDesignatedOrEligible)
  @Mapping.transform(Transform.booleanToYesNo)
  @name("HistoricDesignation")
  historicDesignation: string;

  @Mapping.from(target, Form.historicSiteExplanation)
  @Mapping.when(Form.historicSiteDesignatedOrEligible, Operator.equals, true)
  @name("HistoricDesignationExplanation")
  @minLength(1)
  @maxLength(55)
  historicDesignationExplanation?: string;

  @name("InternationalActivities")
  internationalActivities: InternationalActivities;

  @name("AbstractAttachments")
  abstractAttachments?: AbstractAttachments;

  @name("ProjectNarrativeAttachments")
  projectNarrativeAttachments?: ProjectNarrativeAttachments;

  @name("BibliographyAttachments")
  bibliographyAttachments?: BibliographyAttachments;

  @name("FacilitiesAttachments")
  facilitiesAttachments?: FacilitiesAttachments;

  @name("EquipmentAttachments")
  equipmentAttachments?: EquipmentAttachments;

  @name("OtherAttachments")
  otherAttachments?: OtherAttachments;

  @attribute @name("FormVersion") formVersion: "1.4";
}

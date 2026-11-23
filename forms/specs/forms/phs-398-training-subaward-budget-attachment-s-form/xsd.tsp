import "./form.tsp";
import "@typespec/xml";
import "form-library-xml";
import "#mapping/targets.tsp";
import "#xsd/attachments.tsp";

using TypeSpec.Xml;
using SimplerForms;
namespace XSD.PHSTrainingSubawardBudget;

alias grantsGovXml = Mappings.Target.grantsGovXml;
alias Form = Forms.PHSTrainingSubawardBudget.TrainingSubawardBudget;
alias Labels = Forms.PHSTrainingSubawardBudget.SlotLabels;
alias SourceBudget = Forms.PHSTrainingSubawardBudget.Budget;
alias SourceYear = Forms.PHSTrainingSubawardBudget.BudgetYear;

@nsDeclarations
enum Namespaces {
  PHS398_TrainingSubawardBudget_3_0: "http://apply.grants.gov/forms/PHS398_TrainingSubawardBudget_3_0-V3.0",
  PHS398_TrainingBudget_2_0: "http://apply.grants.gov/forms/PHS398_TrainingBudget_2_0-V2.0",
  att: "http://apply.grants.gov/system/Attachments-V1.0",
  glob: "http://apply.grants.gov/system/Global-V1.0",
}

@ns(Namespaces.PHS398_TrainingSubawardBudget_3_0)
@name("PHS398_TrainingSubawardBudget_3_0")
@GrantsGov.xsd("https://apply07.grants.gov/apply/forms/schemas/PHS398_TrainingSubawardBudget_3_0-V3.0.xsd")
@Mapping.from(grantsGovXml, Form)
model Root {
  @Mapping.from(grantsGovXml, Labels.slot1)
  @name("ATT1")
  slot1?: string;

  @Mapping.from(grantsGovXml, Labels.slot2)
  @name("ATT2")
  slot2?: string;

  @Mapping.from(grantsGovXml, Labels.slot3)
  @name("ATT3")
  slot3?: string;

  @Mapping.from(grantsGovXml, Labels.slot4)
  @name("ATT4")
  slot4?: string;

  @Mapping.from(grantsGovXml, Labels.slot5)
  @name("ATT5")
  slot5?: string;

  @Mapping.from(grantsGovXml, Labels.slot6)
  @name("ATT6")
  slot6?: string;

  @Mapping.from(grantsGovXml, Labels.slot7)
  @name("ATT7")
  slot7?: string;

  @Mapping.from(grantsGovXml, Labels.slot8)
  @name("ATT8")
  slot8?: string;

  @Mapping.from(grantsGovXml, Labels.slot9)
  @name("ATT9")
  slot9?: string;

  @Mapping.from(grantsGovXml, Labels.slot10)
  @name("ATT10")
  slot10?: string;

  @Mapping.from(grantsGovXml, Labels.slot11)
  @name("ATT11")
  slot11?: string;

  @Mapping.from(grantsGovXml, Labels.slot12)
  @name("ATT12")
  slot12?: string;

  @Mapping.from(grantsGovXml, Labels.slot13)
  @name("ATT13")
  slot13?: string;

  @Mapping.from(grantsGovXml, Labels.slot14)
  @name("ATT14")
  slot14?: string;

  @Mapping.from(grantsGovXml, Labels.slot15)
  @name("ATT15")
  slot15?: string;

  @Mapping.from(grantsGovXml, Labels.slot16)
  @name("ATT16")
  slot16?: string;

  @Mapping.from(grantsGovXml, Labels.slot17)
  @name("ATT17")
  slot17?: string;

  @Mapping.from(grantsGovXml, Labels.slot18)
  @name("ATT18")
  slot18?: string;

  @Mapping.from(grantsGovXml, Labels.slot19)
  @name("ATT19")
  slot19?: string;

  @Mapping.from(grantsGovXml, Labels.slot20)
  @name("ATT20")
  slot20?: string;

  @Mapping.from(grantsGovXml, Labels.slot21)
  @name("ATT21")
  slot21?: string;

  @Mapping.from(grantsGovXml, Labels.slot22)
  @name("ATT22")
  slot22?: string;

  @Mapping.from(grantsGovXml, Labels.slot23)
  @name("ATT23")
  slot23?: string;

  @Mapping.from(grantsGovXml, Labels.slot24)
  @name("ATT24")
  slot24?: string;

  @Mapping.from(grantsGovXml, Labels.slot25)
  @name("ATT25")
  slot25?: string;

  @Mapping.from(grantsGovXml, Labels.slot26)
  @name("ATT26")
  slot26?: string;

  @Mapping.from(grantsGovXml, Labels.slot27)
  @name("ATT27")
  slot27?: string;

  @Mapping.from(grantsGovXml, Labels.slot28)
  @name("ATT28")
  slot28?: string;

  @Mapping.from(grantsGovXml, Labels.slot29)
  @name("ATT29")
  slot29?: string;

  @Mapping.from(grantsGovXml, Labels.slot30)
  @name("ATT30")
  slot30?: string;

  @name("BudgetAttachments") group?: BudgetAttachments;
  @attribute @name("FormVersion") formVersion: "3.0";
}

@ns(Namespaces.PHS398_TrainingSubawardBudget_3_0)
model BudgetAttachments {
  @Mapping.from(grantsGovXml, Form.budgets)
  @ns(Namespaces.PHS398_TrainingBudget_2_0)
  @name("PHS398_TrainingBudget_2_0")
  @maxItems(30)
  budgets?: Budget[];
}

@ns(Namespaces.PHS398_TrainingBudget_2_0)
model Budget {
  @Mapping.from(grantsGovXml, SourceBudget.uei)
  @name("SAMUEI")
  uei: string;

  @Mapping.from(grantsGovXml, SourceBudget.budgetType)
  @name("BudgetType")
  budgetType: string;

  @Mapping.from(grantsGovXml, SourceBudget.organizationName)
  @name("OrganizationName")
  organizationName?: string;

  @Mapping.from(grantsGovXml, SourceBudget.years)
  @name("BudgetYear")
  @maxItems(5)
  years?: BudgetYear[];

  @Mapping.from(grantsGovXml, SourceBudget.justification)
  @name("BudgetJustification")
  justification?: Att.AttachedFileDataType;

  @Mapping.from(
    grantsGovXml,
    SourceBudget.cumulativeUndergraduateStipendsRequested
  )
  @name("CumulativeUndergraduateStipendsRequested")
  cumulativeUndergraduateStipendsRequested?: string;

  @Mapping.from(
    grantsGovXml,
    SourceBudget.cumulativeUndergraduateTuitionAndFeesRequested
  )
  @name("CumulativeUndergraduateTuitionAndFeesRequested")
  cumulativeUndergraduateTuitionAndFeesRequested?: string;

  @Mapping.from(
    grantsGovXml,
    SourceBudget.cumulativePredocSingleDegreeStipendsRequested
  )
  @name("CumulativePredocSingleDegreeStipendsRequested")
  cumulativePredocSingleDegreeStipendsRequested?: string;

  @Mapping.from(
    grantsGovXml,
    SourceBudget.cumulativePredocSingleDegreeTuitionAndFeesRequested
  )
  @name("CumulativePredocSingleDegreeTuitionAndFeesRequested")
  cumulativePredocSingleDegreeTuitionAndFeesRequested?: string;

  @Mapping.from(
    grantsGovXml,
    SourceBudget.cumulativePredocDualDegreeStipendsRequested
  )
  @name("CumulativePredocDualDegreeStipendsRequested")
  cumulativePredocDualDegreeStipendsRequested?: string;

  @Mapping.from(
    grantsGovXml,
    SourceBudget.cumulativePredocDualDegreeTuitionAndFeesRequested
  )
  @name("CumulativePredocDualDegreeTuitionAndFeesRequested")
  cumulativePredocDualDegreeTuitionAndFeesRequested?: string;

  @Mapping.from(
    grantsGovXml,
    SourceBudget.cumulativePredocTotalStipendsRequested
  )
  @name("CumulativePredocTotalStipendsRequested")
  cumulativePredocTotalStipendsRequested?: string;

  @Mapping.from(
    grantsGovXml,
    SourceBudget.cumulativePredocTotalTuitionAndFeesRequested
  )
  @name("CumulativePredocTotalTuitionAndFeesRequested")
  cumulativePredocTotalTuitionAndFeesRequested?: string;

  @Mapping.from(
    grantsGovXml,
    SourceBudget.cumulativePostdocNonDegreeStipendsRequested
  )
  @name("CumulativePostdocNonDegreeStipendsRequested")
  cumulativePostdocNonDegreeStipendsRequested?: string;

  @Mapping.from(
    grantsGovXml,
    SourceBudget.cumulativePostdocNonDegreeTuitionAndFeesRequested
  )
  @name("CumulativePostdocNonDegreeTuitionAndFeesRequested")
  cumulativePostdocNonDegreeTuitionAndFeesRequested?: string;

  @Mapping.from(
    grantsGovXml,
    SourceBudget.cumulativePostdocDegreeStipendsRequested
  )
  @name("CumulativePostdocDegreeStipendsRequested")
  cumulativePostdocDegreeStipendsRequested?: string;

  @Mapping.from(
    grantsGovXml,
    SourceBudget.cumulativePostdocDegreeTuitionAndFeesRequested
  )
  @name("CumulativePostdocDegreeTuitionAndFeesRequested")
  cumulativePostdocDegreeTuitionAndFeesRequested?: string;

  @Mapping.from(
    grantsGovXml,
    SourceBudget.cumulativePostdocTotalStipendsRequested
  )
  @name("CumulativePostdocTotalStipendsRequested")
  cumulativePostdocTotalStipendsRequested?: string;

  @Mapping.from(
    grantsGovXml,
    SourceBudget.cumulativePostdocTotalTuitionAndFeesRequested
  )
  @name("CumulativePostdocTotalTuitionAndFeesRequested")
  cumulativePostdocTotalTuitionAndFeesRequested?: string;

  @Mapping.from(grantsGovXml, SourceBudget.cumulativeOtherStipendsRequested)
  @name("CumulativeOtherStipendsRequested")
  cumulativeOtherStipendsRequested?: string;

  @Mapping.from(
    grantsGovXml,
    SourceBudget.cumulativeOtherTuitionAndFeesRequested
  )
  @name("CumulativeOtherTuitionAndFeesRequested")
  cumulativeOtherTuitionAndFeesRequested?: string;

  @Mapping.from(grantsGovXml, SourceBudget.cumulativeTotalStipendsRequested)
  @name("CumulativeTotalStipendsRequested")
  cumulativeTotalStipendsRequested?: string;

  @Mapping.from(grantsGovXml, SourceBudget.cumulativeTuitionAndFeesRequested)
  @name("CumulativeTuitionAndFeesRequested")
  cumulativeTuitionAndFeesRequested?: string;

  @Mapping.from(
    grantsGovXml,
    SourceBudget.cumulativeTotalStipendsAndTuitionFeesRequested
  )
  @name("CumulativeTotalStipendsAndTuitionFeesRequested")
  cumulativeTotalStipendsAndTuitionFeesRequested?: string;

  @Mapping.from(grantsGovXml, SourceBudget.cumulativeTraineeTravelRequested)
  @name("CumulativeTraineeTravelRequested")
  cumulativeTraineeTravelRequested?: string;

  @Mapping.from(
    grantsGovXml,
    SourceBudget.cumulativeTrainingRelatedExpensesRequested
  )
  @name("CumulativeTrainingRelatedExpensesRequested")
  cumulativeTrainingRelatedExpensesRequested?: string;

  @Mapping.from(
    grantsGovXml,
    SourceBudget.cumulativeResearchDirectCostsRequested
  )
  @name("CumulativeResearchDirectCostsRequested")
  cumulativeResearchDirectCostsRequested?: string;

  @Mapping.from(
    grantsGovXml,
    SourceBudget.cumulativeConsortiumTrainingCostsRequested
  )
  @name("CumulativeConsortiumTrainingCostsRequested")
  cumulativeConsortiumTrainingCostsRequested?: string;

  @Mapping.from(
    grantsGovXml,
    SourceBudget.cumulativeTotalOtherDirectCostsRequested
  )
  @name("CumulativeTotalOtherDirectCostsRequested")
  cumulativeTotalOtherDirectCostsRequested?: string;

  @Mapping.from(grantsGovXml, SourceBudget.cumulativeTotalDirectCostsRequested)
  @name("CumulativeTotalDirectCostsRequested")
  cumulativeTotalDirectCostsRequested?: string;

  @Mapping.from(
    grantsGovXml,
    SourceBudget.cumulativeTotalIndirectCostsRequested
  )
  @name("CumulativeTotalIndirectCostsRequested")
  cumulativeTotalIndirectCostsRequested?: string;

  @Mapping.from(
    grantsGovXml,
    SourceBudget.cumulativeTotalDirectAndIndirectCostsRequested
  )
  @name("CumulativeTotalDirectAndIndirectCostsRequested")
  cumulativeTotalDirectAndIndirectCostsRequested?: string;

  @attribute @name("FormVersion") formVersion: "2.0";
}

@ns(Namespaces.PHS398_TrainingBudget_2_0)
model BudgetYear {
  @Mapping.from(grantsGovXml, SourceYear.periodStartDate)
  @name("PeriodStartDate")
  periodStartDate: plainDate;

  @Mapping.from(grantsGovXml, SourceYear.periodEndDate)
  @name("PeriodEndDate")
  periodEndDate: plainDate;

  @Mapping.from(grantsGovXml, SourceYear.undergraduateNumFullTime)
  @name("UndergraduateNumFullTime")
  undergraduateNumFullTime?: int32;

  @Mapping.from(grantsGovXml, SourceYear.undergraduateNumShortTerm)
  @name("UndergraduateNumShortTerm")
  undergraduateNumShortTerm?: int32;

  @Mapping.from(grantsGovXml, SourceYear.undergraduateStipendsRequested)
  @name("UndergraduateStipendsRequested")
  undergraduateStipendsRequested?: string;

  @Mapping.from(grantsGovXml, SourceYear.undergraduateTuitionAndFeesRequested)
  @name("UndergraduateTuitionAndFeesRequested")
  undergraduateTuitionAndFeesRequested?: string;

  @Mapping.from(
    grantsGovXml,
    SourceYear.undergraduateNumFirstYearSophomoreStipends
  )
  @name("UndergraduateNumFirstYearSophomoreStipends")
  undergraduateNumFirstYearSophomoreStipends?: int32;

  @Mapping.from(grantsGovXml, SourceYear.undergraduateNumJuniorSeniorStipends)
  @name("UndergraduateNumJuniorSeniorStipends")
  undergraduateNumJuniorSeniorStipends?: int32;

  @Mapping.from(grantsGovXml, SourceYear.predocSingleDegreeNumFullTime)
  @name("PredocSingleDegreeNumFullTime")
  predocSingleDegreeNumFullTime?: int32;

  @Mapping.from(grantsGovXml, SourceYear.predocSingleDegreeNumShortTerm)
  @name("PredocSingleDegreeNumShortTerm")
  predocSingleDegreeNumShortTerm?: int32;

  @Mapping.from(grantsGovXml, SourceYear.predocSingleDegreeStipendsRequested)
  @name("PredocSingleDegreeStipendsRequested")
  predocSingleDegreeStipendsRequested?: string;

  @Mapping.from(
    grantsGovXml,
    SourceYear.predocSingleDegreeTuitionAndFeesRequested
  )
  @name("PredocSingleDegreeTuitionAndFeesRequested")
  predocSingleDegreeTuitionAndFeesRequested?: string;

  @Mapping.from(grantsGovXml, SourceYear.predocDualDegreeNumFullTime)
  @name("PredocDualDegreeNumFullTime")
  predocDualDegreeNumFullTime?: int32;

  @Mapping.from(grantsGovXml, SourceYear.predocDualDegreeNumShortTerm)
  @name("PredocDualDegreeNumShortTerm")
  predocDualDegreeNumShortTerm?: int32;

  @Mapping.from(grantsGovXml, SourceYear.predocDualDegreeStipendsRequested)
  @name("PredocDualDegreeStipendsRequested")
  predocDualDegreeStipendsRequested?: string;

  @Mapping.from(
    grantsGovXml,
    SourceYear.predocDualDegreeTuitionAndFeesRequested
  )
  @name("PredocDualDegreeTuitionAndFeesRequested")
  predocDualDegreeTuitionAndFeesRequested?: string;

  @Mapping.from(grantsGovXml, SourceYear.predocTotalNumFullTime)
  @name("PredocTotalNumFullTime")
  predocTotalNumFullTime?: int32;

  @Mapping.from(grantsGovXml, SourceYear.predocTotalNumShortTerm)
  @name("PredocTotalNumShortTerm")
  predocTotalNumShortTerm?: int32;

  @Mapping.from(grantsGovXml, SourceYear.predocTotalStipendsRequested)
  @name("PredocTotalStipendsRequested")
  predocTotalStipendsRequested?: string;

  @Mapping.from(grantsGovXml, SourceYear.predocTotalTuitionAndFeesRequested)
  @name("PredocTotalTuitionAndFeesRequested")
  predocTotalTuitionAndFeesRequested?: string;

  @Mapping.from(grantsGovXml, SourceYear.postdocNumNonDegreeFullTime)
  @name("PostdocNumNonDegreeFullTime")
  postdocNumNonDegreeFullTime?: int32;

  @Mapping.from(grantsGovXml, SourceYear.postdocNumNonDegreeShortTerm)
  @name("PostdocNumNonDegreeShortTerm")
  postdocNumNonDegreeShortTerm?: int32;

  @Mapping.from(grantsGovXml, SourceYear.postdocNumNonDegreeStipendLevel0)
  @name("PostdocNumNonDegreeStipendLevel0")
  postdocNumNonDegreeStipendLevel0?: int32;

  @Mapping.from(grantsGovXml, SourceYear.postdocNumNonDegreeStipendLevel1)
  @name("PostdocNumNonDegreeStipendLevel1")
  postdocNumNonDegreeStipendLevel1?: int32;

  @Mapping.from(grantsGovXml, SourceYear.postdocNumNonDegreeStipendLevel2)
  @name("PostdocNumNonDegreeStipendLevel2")
  postdocNumNonDegreeStipendLevel2?: int32;

  @Mapping.from(grantsGovXml, SourceYear.postdocNumNonDegreeStipendLevel3)
  @name("PostdocNumNonDegreeStipendLevel3")
  postdocNumNonDegreeStipendLevel3?: int32;

  @Mapping.from(grantsGovXml, SourceYear.postdocNumNonDegreeStipendLevel4)
  @name("PostdocNumNonDegreeStipendLevel4")
  postdocNumNonDegreeStipendLevel4?: int32;

  @Mapping.from(grantsGovXml, SourceYear.postdocNumNonDegreeStipendLevel5)
  @name("PostdocNumNonDegreeStipendLevel5")
  postdocNumNonDegreeStipendLevel5?: int32;

  @Mapping.from(grantsGovXml, SourceYear.postdocNumNonDegreeStipendLevel6)
  @name("PostdocNumNonDegreeStipendLevel6")
  postdocNumNonDegreeStipendLevel6?: int32;

  @Mapping.from(grantsGovXml, SourceYear.postdocNumNonDegreeStipendLevel7)
  @name("PostdocNumNonDegreeStipendLevel7")
  postdocNumNonDegreeStipendLevel7?: int32;

  @Mapping.from(grantsGovXml, SourceYear.postdocNonDegreeStipendsRequested)
  @name("PostdocNonDegreeStipendsRequested")
  postdocNonDegreeStipendsRequested?: string;

  @Mapping.from(
    grantsGovXml,
    SourceYear.postdocNonDegreeTuitionAndFeesRequested
  )
  @name("PostdocNonDegreeTuitionAndFeesRequested")
  postdocNonDegreeTuitionAndFeesRequested?: string;

  @Mapping.from(grantsGovXml, SourceYear.postdocNumDegreeFullTime)
  @name("PostdocNumDegreeFullTime")
  postdocNumDegreeFullTime?: int32;

  @Mapping.from(grantsGovXml, SourceYear.postdocNumDegreeShortTerm)
  @name("PostdocNumDegreeShortTerm")
  postdocNumDegreeShortTerm?: int32;

  @Mapping.from(grantsGovXml, SourceYear.postdocNumDegreeStipendLevel0)
  @name("PostdocNumDegreeStipendLevel0")
  postdocNumDegreeStipendLevel0?: int32;

  @Mapping.from(grantsGovXml, SourceYear.postdocNumDegreeStipendLevel1)
  @name("PostdocNumDegreeStipendLevel1")
  postdocNumDegreeStipendLevel1?: int32;

  @Mapping.from(grantsGovXml, SourceYear.postdocNumDegreeStipendLevel2)
  @name("PostdocNumDegreeStipendLevel2")
  postdocNumDegreeStipendLevel2?: int32;

  @Mapping.from(grantsGovXml, SourceYear.postdocNumDegreeStipendLevel3)
  @name("PostdocNumDegreeStipendLevel3")
  postdocNumDegreeStipendLevel3?: int32;

  @Mapping.from(grantsGovXml, SourceYear.postdocNumDegreeStipendLevel4)
  @name("PostdocNumDegreeStipendLevel4")
  postdocNumDegreeStipendLevel4?: int32;

  @Mapping.from(grantsGovXml, SourceYear.postdocNumDegreeStipendLevel5)
  @name("PostdocNumDegreeStipendLevel5")
  postdocNumDegreeStipendLevel5?: int32;

  @Mapping.from(grantsGovXml, SourceYear.postdocNumDegreeStipendLevel6)
  @name("PostdocNumDegreeStipendLevel6")
  postdocNumDegreeStipendLevel6?: int32;

  @Mapping.from(grantsGovXml, SourceYear.postdocNumDegreeStipendLevel7)
  @name("PostdocNumDegreeStipendLevel7")
  postdocNumDegreeStipendLevel7?: int32;

  @Mapping.from(grantsGovXml, SourceYear.postdocDegreeStipendsRequested)
  @name("PostdocDegreeStipendsRequested")
  postdocDegreeStipendsRequested?: string;

  @Mapping.from(grantsGovXml, SourceYear.postdocDegreeTuitionAndFeesRequested)
  @name("PostdocDegreeTuitionAndFeesRequested")
  postdocDegreeTuitionAndFeesRequested?: string;

  @Mapping.from(grantsGovXml, SourceYear.postdocTotalFullTime)
  @name("PostdocTotalFullTime")
  postdocTotalFullTime?: int32;

  @Mapping.from(grantsGovXml, SourceYear.postdocTotalShortTerm)
  @name("PostdocTotalShortTerm")
  postdocTotalShortTerm?: int32;

  @Mapping.from(grantsGovXml, SourceYear.postdocTotalStipendLevel0)
  @name("PostdocTotalStipendLevel0")
  postdocTotalStipendLevel0?: int32;

  @Mapping.from(grantsGovXml, SourceYear.postdocTotalStipendLevel1)
  @name("PostdocTotalStipendLevel1")
  postdocTotalStipendLevel1?: int32;

  @Mapping.from(grantsGovXml, SourceYear.postdocTotalStipendLevel2)
  @name("PostdocTotalStipendLevel2")
  postdocTotalStipendLevel2?: int32;

  @Mapping.from(grantsGovXml, SourceYear.postdocTotalStipendLevel3)
  @name("PostdocTotalStipendLevel3")
  postdocTotalStipendLevel3?: int32;

  @Mapping.from(grantsGovXml, SourceYear.postdocTotalStipendLevel4)
  @name("PostdocTotalStipendLevel4")
  postdocTotalStipendLevel4?: int32;

  @Mapping.from(grantsGovXml, SourceYear.postdocTotalStipendLevel5)
  @name("PostdocTotalStipendLevel5")
  postdocTotalStipendLevel5?: int32;

  @Mapping.from(grantsGovXml, SourceYear.postdocTotalStipendLevel6)
  @name("PostdocTotalStipendLevel6")
  postdocTotalStipendLevel6?: int32;

  @Mapping.from(grantsGovXml, SourceYear.postdocTotalStipendLevel7)
  @name("PostdocTotalStipendLevel7")
  postdocTotalStipendLevel7?: int32;

  @Mapping.from(grantsGovXml, SourceYear.postdocTotalStipendsRequested)
  @name("PostdocTotalStipendsRequested")
  postdocTotalStipendsRequested?: string;

  @Mapping.from(grantsGovXml, SourceYear.postdocTotalTuitionAndFeesRequested)
  @name("PostdocTotalTuitionAndFeesRequested")
  postdocTotalTuitionAndFeesRequested?: string;

  @Mapping.from(grantsGovXml, SourceYear.otherNumFullTime)
  @name("OtherNumFullTime")
  otherNumFullTime?: int32;

  @Mapping.from(grantsGovXml, SourceYear.otherNumShortTerm)
  @name("OtherNumShortTerm")
  otherNumShortTerm?: int32;

  @Mapping.from(grantsGovXml, SourceYear.otherStipendsRequested)
  @name("OtherStipendsRequested")
  otherStipendsRequested?: string;

  @Mapping.from(grantsGovXml, SourceYear.otherTuitionAndFeesRequested)
  @name("OtherTuitionAndFeesRequested")
  otherTuitionAndFeesRequested?: string;

  @Mapping.from(grantsGovXml, SourceYear.totalStipendsRequested)
  @name("TotalStipendsRequested")
  totalStipendsRequested?: string;

  @Mapping.from(grantsGovXml, SourceYear.totalTuitionAndFeesRequested)
  @name("TotalTuitionAndFeesRequested")
  totalTuitionAndFeesRequested?: string;

  @Mapping.from(grantsGovXml, SourceYear.totalStipendsAndTuitionFeesRequested)
  @name("TotalStipendsAndTuitionFeesRequested")
  totalStipendsAndTuitionFeesRequested?: string;

  @Mapping.from(grantsGovXml, SourceYear.traineeTravelRequested)
  @name("TraineeTravelRequested")
  traineeTravelRequested?: string;

  @Mapping.from(grantsGovXml, SourceYear.trainingRelatedExpensesRequested)
  @name("TrainingRelatedExpensesRequested")
  trainingRelatedExpensesRequested?: string;

  @Mapping.from(grantsGovXml, SourceYear.researchDirectCostsRequested)
  @name("ResearchDirectCostsRequested")
  researchDirectCostsRequested?: string;

  @Mapping.from(grantsGovXml, SourceYear.consortiumTrainingCostsRequested)
  @name("ConsortiumTrainingCostsRequested")
  consortiumTrainingCostsRequested?: string;

  @Mapping.from(grantsGovXml, SourceYear.totalOtherDirectCostsRequested)
  @name("TotalOtherDirectCostsRequested")
  totalOtherDirectCostsRequested?: string;

  @Mapping.from(grantsGovXml, SourceYear.totalDirectCostsRequested)
  @name("TotalDirectCostsRequested")
  totalDirectCostsRequested?: string;

  @Mapping.from(grantsGovXml, SourceYear.indirectCostType1)
  @name("IndirectCostType1")
  indirectCostType1?: string;

  @Mapping.from(grantsGovXml, SourceYear.indirectCostBase1)
  @name("IndirectCostBase1")
  indirectCostBase1?: string;

  @Mapping.from(grantsGovXml, SourceYear.indirectCostRate1)
  @name("IndirectCostRate1")
  indirectCostRate1?: string;

  @Mapping.from(grantsGovXml, SourceYear.indirectCostFundsRequested1)
  @name("IndirectCostFundsRequested1")
  indirectCostFundsRequested1?: string;

  @Mapping.from(grantsGovXml, SourceYear.indirectCostType2)
  @name("IndirectCostType2")
  indirectCostType2?: string;

  @Mapping.from(grantsGovXml, SourceYear.indirectCostBase2)
  @name("IndirectCostBase2")
  indirectCostBase2?: string;

  @Mapping.from(grantsGovXml, SourceYear.indirectCostRate2)
  @name("IndirectCostRate2")
  indirectCostRate2?: string;

  @Mapping.from(grantsGovXml, SourceYear.indirectCostFundsRequested2)
  @name("IndirectCostFundsRequested2")
  indirectCostFundsRequested2?: string;

  @Mapping.from(grantsGovXml, SourceYear.totalIndirectCostsRequested)
  @name("TotalIndirectCostsRequested")
  totalIndirectCostsRequested?: string;

  @Mapping.from(grantsGovXml, SourceYear.totalDirectAndIndirectCostsRequested)
  @name("TotalDirectAndIndirectCostsRequested")
  totalDirectAndIndirectCostsRequested?: string;
}

import "#questions/types/attachment.tsp";
import "#questions/organization/index.tsp";

namespace Forms.PHSTrainingSubawardBudget;

// The source PDF stores decimal amounts as text. Keep its cents through XML generation.
@pattern("^[0-9]{1,12}(\\.[0-9]{1,2})?$")
scalar Amount extends string;

@pattern("^[0-9]{1,13}(\\.[0-9]{1,2})?$")
scalar TotalAmount extends string;

@pattern("^[0-9]{1,3}(\\.[0-9]{1,2})?$")
scalar Rate extends string;

@minValue(0)
@maxValue(999)
scalar TraineeCount extends int32;

@minValue(0)
@maxValue(9999)
scalar TotalCount extends int32;

enum BudgetType {
  project: "Project",
  subaward: "Subaward/Consortium",
}

// Values read from the completed PHS 398 Training Budget v2.0.
model Budget {
  uei: Questions.Organizations.OrgUei;
  budgetType: BudgetType;
  organizationName?: Questions.Organizations.OrgName;
  @maxItems(5) years?: BudgetYear[];
  justification?: Questions.Types.Attachment;
  cumulativeUndergraduateStipendsRequested?: TotalAmount;
  cumulativeUndergraduateTuitionAndFeesRequested?: TotalAmount;
  cumulativePredocSingleDegreeStipendsRequested?: TotalAmount;
  cumulativePredocSingleDegreeTuitionAndFeesRequested?: TotalAmount;
  cumulativePredocDualDegreeStipendsRequested?: TotalAmount;
  cumulativePredocDualDegreeTuitionAndFeesRequested?: TotalAmount;
  cumulativePredocTotalStipendsRequested?: TotalAmount;
  cumulativePredocTotalTuitionAndFeesRequested?: TotalAmount;
  cumulativePostdocNonDegreeStipendsRequested?: TotalAmount;
  cumulativePostdocNonDegreeTuitionAndFeesRequested?: TotalAmount;
  cumulativePostdocDegreeStipendsRequested?: TotalAmount;
  cumulativePostdocDegreeTuitionAndFeesRequested?: TotalAmount;
  cumulativePostdocTotalStipendsRequested?: TotalAmount;
  cumulativePostdocTotalTuitionAndFeesRequested?: TotalAmount;
  cumulativeOtherStipendsRequested?: TotalAmount;
  cumulativeOtherTuitionAndFeesRequested?: TotalAmount;
  cumulativeTotalStipendsRequested?: TotalAmount;
  cumulativeTuitionAndFeesRequested?: TotalAmount;
  cumulativeTotalStipendsAndTuitionFeesRequested?: TotalAmount;
  cumulativeTraineeTravelRequested?: Amount;
  cumulativeTrainingRelatedExpensesRequested?: Amount;
  cumulativeResearchDirectCostsRequested?: Amount;
  cumulativeConsortiumTrainingCostsRequested?: Amount;
  cumulativeTotalOtherDirectCostsRequested?: TotalAmount;
  cumulativeTotalDirectCostsRequested?: TotalAmount;
  cumulativeTotalIndirectCostsRequested?: TotalAmount;
  cumulativeTotalDirectAndIndirectCostsRequested?: TotalAmount;
}

model BudgetYear {
  periodStartDate: plainDate;
  periodEndDate: plainDate;
  undergraduateNumFullTime?: TraineeCount;
  undergraduateNumShortTerm?: TraineeCount;
  undergraduateStipendsRequested?: Amount;
  undergraduateTuitionAndFeesRequested?: Amount;
  undergraduateNumFirstYearSophomoreStipends?: TraineeCount;
  undergraduateNumJuniorSeniorStipends?: TraineeCount;
  predocSingleDegreeNumFullTime?: TraineeCount;
  predocSingleDegreeNumShortTerm?: TraineeCount;
  predocSingleDegreeStipendsRequested?: Amount;
  predocSingleDegreeTuitionAndFeesRequested?: Amount;
  predocDualDegreeNumFullTime?: TraineeCount;
  predocDualDegreeNumShortTerm?: TraineeCount;
  predocDualDegreeStipendsRequested?: Amount;
  predocDualDegreeTuitionAndFeesRequested?: Amount;
  predocTotalNumFullTime?: TotalCount;
  predocTotalNumShortTerm?: TotalCount;
  predocTotalStipendsRequested?: TotalAmount;
  predocTotalTuitionAndFeesRequested?: TotalAmount;
  postdocNumNonDegreeFullTime?: TraineeCount;
  postdocNumNonDegreeShortTerm?: TraineeCount;
  postdocNumNonDegreeStipendLevel0?: TraineeCount;
  postdocNumNonDegreeStipendLevel1?: TraineeCount;
  postdocNumNonDegreeStipendLevel2?: TraineeCount;
  postdocNumNonDegreeStipendLevel3?: TraineeCount;
  postdocNumNonDegreeStipendLevel4?: TraineeCount;
  postdocNumNonDegreeStipendLevel5?: TraineeCount;
  postdocNumNonDegreeStipendLevel6?: TraineeCount;
  postdocNumNonDegreeStipendLevel7?: TraineeCount;
  postdocNonDegreeStipendsRequested?: Amount;
  postdocNonDegreeTuitionAndFeesRequested?: Amount;
  postdocNumDegreeFullTime?: TraineeCount;
  postdocNumDegreeShortTerm?: TraineeCount;
  postdocNumDegreeStipendLevel0?: TraineeCount;
  postdocNumDegreeStipendLevel1?: TraineeCount;
  postdocNumDegreeStipendLevel2?: TraineeCount;
  postdocNumDegreeStipendLevel3?: TraineeCount;
  postdocNumDegreeStipendLevel4?: TraineeCount;
  postdocNumDegreeStipendLevel5?: TraineeCount;
  postdocNumDegreeStipendLevel6?: TraineeCount;
  postdocNumDegreeStipendLevel7?: TraineeCount;
  postdocDegreeStipendsRequested?: Amount;
  postdocDegreeTuitionAndFeesRequested?: Amount;
  postdocTotalFullTime?: TotalCount;
  postdocTotalShortTerm?: TotalCount;
  postdocTotalStipendLevel0?: TotalCount;
  postdocTotalStipendLevel1?: TotalCount;
  postdocTotalStipendLevel2?: TotalCount;
  postdocTotalStipendLevel3?: TotalCount;
  postdocTotalStipendLevel4?: TotalCount;
  postdocTotalStipendLevel5?: TotalCount;
  postdocTotalStipendLevel6?: TotalCount;
  postdocTotalStipendLevel7?: TotalCount;
  postdocTotalStipendsRequested?: TotalAmount;
  postdocTotalTuitionAndFeesRequested?: TotalAmount;
  otherNumFullTime?: TraineeCount;
  otherNumShortTerm?: TraineeCount;
  otherStipendsRequested?: Amount;
  otherTuitionAndFeesRequested?: Amount;
  totalStipendsRequested?: TotalAmount;
  totalTuitionAndFeesRequested?: TotalAmount;
  totalStipendsAndTuitionFeesRequested?: TotalAmount;
  traineeTravelRequested?: Amount;
  trainingRelatedExpensesRequested?: Amount;
  researchDirectCostsRequested?: Amount;
  consortiumTrainingCostsRequested?: Amount;
  totalOtherDirectCostsRequested?: TotalAmount;
  totalDirectCostsRequested?: TotalAmount;
  @minLength(1) @maxLength(64) indirectCostType1?: string;
  indirectCostBase1?: Amount;
  indirectCostRate1?: Rate;
  indirectCostFundsRequested1?: Amount;
  @minLength(1) @maxLength(64) indirectCostType2?: string;
  indirectCostBase2?: Amount;
  indirectCostRate2?: Rate;
  indirectCostFundsRequested2?: Amount;
  totalIndirectCostsRequested?: TotalAmount;
  totalDirectAndIndirectCostsRequested?: TotalAmount;
}

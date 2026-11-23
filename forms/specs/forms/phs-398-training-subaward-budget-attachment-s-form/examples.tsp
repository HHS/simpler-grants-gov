import "./budget.tsp";

namespace Forms.PHSTrainingSubawardBudget.Examples;

// Illustrative references for the source PDF and the justification embedded inside it.
const oneBudget = #{
  attachments: #{ slot1: "00000000-0000-4000-8000-000000000001" },
  labels: #{ slot1: "Example Consortium Budget" },
  budgets: #[
    #{
      uei: "Z7KLM3ABCD29",
      budgetType: BudgetType.subaward,
      organizationName: "Example Training Consortium",
      years: #[
        #{
          periodStartDate: plainDate.fromISO("2026-12-01"),
          periodEndDate: plainDate.fromISO("2026-12-31"),
          trainingRelatedExpensesRequested: "0.00",
          totalOtherDirectCostsRequested: "0.00",
          totalDirectCostsRequested: "0.00",
          totalDirectAndIndirectCostsRequested: "0.00",
        }
      ],
      justification: "00000000-0000-4000-8000-000000000002",
      cumulativeTrainingRelatedExpensesRequested: "0.00",
      cumulativeTotalOtherDirectCostsRequested: "0.00",
      cumulativeTotalDirectCostsRequested: "0.00",
      cumulativeTotalDirectAndIndirectCostsRequested: "0.00",
    }
  ],
};

import "simpler-forms";
import "./form.tsp";

using SimplerForms;
namespace Forms.PHSTrainingSubawardBudget;

@UI.layout(TrainingSubawardBudget)
model TrainingSubawardBudgetLayout {
  @UI.label("Training subaward budgets")
  @doc("For each consortium, use the original fillable PHS 398 Training Budget PDF from the opportunity’s Grants.gov Workspace package. Attach the completed file in its original fillable format.")
  files: {
    attachments: TrainingSubawardBudget.attachments;
  };

  @UI.omit labels: TrainingSubawardBudget.labels;
  @UI.omit budgets: TrainingSubawardBudget.budgets;
}

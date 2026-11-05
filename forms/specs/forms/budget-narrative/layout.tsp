import "simpler-forms";
import "./form.tsp";
using SimplerForms;
namespace Forms.BudgetNarrative;
@UI.layout(BudgetNarrative)
model BudgetNarrativeLayout {
  @UI.label("1. Budget Narrative File(s)")
  files: {
    attachments: BudgetNarrative.attachments;
  };
}

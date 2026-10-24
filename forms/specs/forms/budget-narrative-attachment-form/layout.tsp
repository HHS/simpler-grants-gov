import "simpler-forms";
import "./form.tsp";
using SimplerForms;
namespace Forms.BudgetNarrative;

@UI.layout(BudgetNarrative)
model BudgetNarrativeLayout {
  @doc("The source PDF separates a mandatory first file from optional additional files. The proposed list preserves at least one file and a maximum of 100, following the existing SGG contract.")
  @UI.label("Budget Narrative Files")
  section1: {
    attachments: BudgetNarrative.attachments;
  };
}

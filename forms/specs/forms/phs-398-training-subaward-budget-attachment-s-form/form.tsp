import "form-library-xml";
import "simpler-forms";
import "#forms/index.tsp";
import "./budget.tsp";
import "./examples.tsp";

using SimplerForms;
namespace Forms.PHSTrainingSubawardBudget;

@Meta.form(#{
  id: "phs-398-training-subaward-budget-attachment-s-form",
  formName: "PHS 398 Training Subaward Budget Attachment(s) Form",
})
@GrantsGov.form(#{
  legacyFormId: 732,
  shortFormName: "PHS398_TrainingSubawardBudget_3_0",
  formVersion: "3.0",
  agencyCode: "SGG",
  ombNumber: "0925-0001",
  expirationDate: "2027-12-31",
})
@example(#{}, #{ title: "No subaward budgets" })
@example(Examples.oneBudget, #{ title: "One imported consortium budget" })
model TrainingSubawardBudget {
  @Meta.role(ResponseRole.applicantInput)
  attachments?: BudgetFiles;

  @Meta.role(ResponseRole.systemValue)
  labels?: SlotLabels;

  @Meta.role(ResponseRole.systemValue)
  @maxItems(30)
  budgets?: Budget[];
}

// The original PDF supplies the data; only its embedded justification is submitted as a file.
@UI.widget(Rendering.Widget.Attachment)
@format("uuid")
@UI.label("Attach Training Subaward Budget ${N}")
@doc("Attach Training Subaward Budget ${N}: Attach completed PHS 398 Training Budget form. The form must be in its original extracted format (i.e., do not re-PDF form).")
scalar BudgetPdf<N extends valueof string> extends string;

model BudgetFiles {
  slot1?: BudgetPdf<"1">;
  slot2?: BudgetPdf<"2">;
  slot3?: BudgetPdf<"3">;
  slot4?: BudgetPdf<"4">;
  slot5?: BudgetPdf<"5">;
  slot6?: BudgetPdf<"6">;
  slot7?: BudgetPdf<"7">;
  slot8?: BudgetPdf<"8">;
  slot9?: BudgetPdf<"9">;
  slot10?: BudgetPdf<"10">;
  slot11?: BudgetPdf<"11">;
  slot12?: BudgetPdf<"12">;
  slot13?: BudgetPdf<"13">;
  slot14?: BudgetPdf<"14">;
  slot15?: BudgetPdf<"15">;
  slot16?: BudgetPdf<"16">;
  slot17?: BudgetPdf<"17">;
  slot18?: BudgetPdf<"18">;
  slot19?: BudgetPdf<"19">;
  slot20?: BudgetPdf<"20">;
  slot21?: BudgetPdf<"21">;
  slot22?: BudgetPdf<"22">;
  slot23?: BudgetPdf<"23">;
  slot24?: BudgetPdf<"24">;
  slot25?: BudgetPdf<"25">;
  slot26?: BudgetPdf<"26">;
  slot27?: BudgetPdf<"27">;
  slot28?: BudgetPdf<"28">;
  slot29?: BudgetPdf<"29">;
  slot30?: BudgetPdf<"30">;
}

// The XML has thirty individually named optional elements. Their values are the
// row names inside the budget PDFs; the filenames and attachment UUIDs are different.
model SlotLabels {
  slot1?: string;
  slot2?: string;
  slot3?: string;
  slot4?: string;
  slot5?: string;
  slot6?: string;
  slot7?: string;
  slot8?: string;
  slot9?: string;
  slot10?: string;
  slot11?: string;
  slot12?: string;
  slot13?: string;
  slot14?: string;
  slot15?: string;
  slot16?: string;
  slot17?: string;
  slot18?: string;
  slot19?: string;
  slot20?: string;
  slot21?: string;
  slot22?: string;
  slot23?: string;
  slot24?: string;
  slot25?: string;
  slot26?: string;
  slot27?: string;
  slot28?: string;
  slot29?: string;
  slot30?: string;
}

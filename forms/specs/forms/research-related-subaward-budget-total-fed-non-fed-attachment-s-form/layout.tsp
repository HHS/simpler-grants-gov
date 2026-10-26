import "simpler-forms";
import "./form.tsp";
using SimplerForms;
namespace Forms.RRFedNonFedSubawardBudget;

@UI.layout(RRFedNonFedSubawardBudget)
model RRFedNonFedSubawardBudgetLayout {
  @UI.label("Subaward budget files")
  @doc("Instructions:  On this form, you will attach the R&R Subaward Budget (Fed/Non-Fed) files for your grant application.  Complete the subawardee budget(s) in  accordance with the R&R (Fed/Non-Fed) budget instructions.  Please remember that any files you attach must be a PDF document.\n\nImportant: Please attach your subawardee budget file(s) with the file name of the subawardee organization.  Each file name must be unique. \n\nOriginal template-extraction instruction: Click here to extract the R&R Budget (Fed/Non-Fed) Attachment\n\nThe Adobe PDF version of the R&R Budget (Fed/Non-Fed) 5 Year Form will be compressed and embedded into this form.  The applicant will click the button and a dialog box will appear where applicant indicates where to save the file.\n\nThe extraction button belongs to the original PDF workflow. This preview displays the instruction and accepts illustrative file references; it does not extract a template, upload a file or submit a budget.")
  section1: {
    attachments: RRFedNonFedSubawardBudget.attachments;
  };
}

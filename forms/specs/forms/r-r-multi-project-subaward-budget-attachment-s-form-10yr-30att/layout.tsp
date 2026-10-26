import "simpler-forms";
import "./form.tsp";
using SimplerForms;
namespace Forms.RRMultiProjectSubawardBudget;

@UI.layout(RRMultiProjectSubawardBudget)
model RRMultiProjectSubawardBudgetLayout {
  @UI.label("Subaward budget files")
  @doc("Instructions: On this form, you will attach the 10 Year R&R Subaward Budget files for your grant application.  Complete the subawardee budget(s) in  accordance with the 10 Year R&R budget instructions. Please remember that any files you attach must be a PDF document.\n\nImportant: Please attach your subawardee budget file(s) with the file name of the subawardee organization.  Each file name must be unique. \n\nOriginal template-extraction instruction: Click here to extract the 10 Year R&R Subaward Budget Attachment\n\nThe PDF of the 10 Year R&R Budget Form will be embedded into this form.  The applicant will click the button and a dialog box will appear where applicant indicates where to save the file.\n\nThe extraction button belongs to the original PDF workflow. This preview displays the instruction and accepts illustrative file references; it does not extract a template, upload a file or submit a budget.")
  section1: {
    attachments: RRMultiProjectSubawardBudget.attachments;
  };
}

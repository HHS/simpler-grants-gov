import "simpler-forms";
import "./form.tsp";
using SimplerForms;
namespace Forms.PHSTrainingSubawardBudget;

@UI.layout(PHSTrainingSubawardBudget)
model PHSTrainingSubawardBudgetLayout {
  @UI.label("Training subaward budget files")
  @doc("Instructions:\n\nThis form allows you to attach a PHS 398 Training Budget form for each subaward/consortium associated with your application. Use the \"Click here to extract the PHS 398 Training Subaward Attachment\" button to extract a blank copy of the PHS 398 Training Budget form, complete the form in accordance with the agency instructions, and attach the completed form using one of the \"Add Attachment\" buttons.\n\n\n\nImportant: \n\nAttach Training Subaward Budget forms, using the blocks below. Remember that the files you attach must be PHS 398 Training Budget PDF forms, which were previously extracted using the process outlined above. Attaching any other type of file may result in the inability to submit your application to Grants.gov.\n\nOriginal template-extraction instruction: Click here to extract the PHS 398 Training Subaward Budget Attachment\n\nThe Adobe Acrobat PDF version of the PHS 398 Training Budget Form will be compressed and embedded into this form.  The applicant will click the button and a dialog box will appear, at which point the applicant indicates where to save the file.\n\nThe extraction button belongs to the original PDF workflow. This preview displays the instruction and accepts illustrative file references; it does not extract a template, upload a file or submit a budget.")
  section1: {
    attachments: PHSTrainingSubawardBudget.attachments;
  };

  @UI.label("Public burden statement")
  @doc("Public reporting burden for this collection of information is estimated to average 1.5 hours per response, including the time for reviewing instructions, searching existing data sources, gathering and maintaining the data needed, and completing and reviewing the collection of information.  An agency may not conduct or sponsor, and a person is not required to respond to, a collection of information unless it displays a currently valid OMB control number.  Send comments regarding this burden estimate or any other aspect of this collection of information, including suggestions for reducing this burden, to: NIH, Project Clearance Branch, 6705 Rockledge Drive, MSC 7974, Bethesda, MD 20892-7974, ATTN: PRA (0925-0001).  Do not return the completed form to this address. ")
  burden: {};
}

import "form-library-xml";
import "simpler-forms";
import "simpler-forms-sgg";
import "#forms/index.tsp";
import "./fragments.tsp";
import "./examples.tsp";
using SimplerForms;
namespace Forms.SF424Mandatory;

@Meta.form(#{ id: "sf424-mandatory", formName: "SF424 Mandatory Form" })
@GrantsGov.form(#{
  legacyFormId: 712,
  shortFormName: "SF424_Mandatory_3_0",
  formVersion: "3.0",
  agencyCode: "SGG",
  ombNumber: "4040-0020",
  expirationDate: "2029-03-31",
})
@example(Examples.complete)
@example(Examples.minimum)
model SF424Mandatory {
  submission: MandatorySubmission;
  dates?: MandatoryDates;
  identifiers?: MandatoryIdentifiers;
  applicant: MandatoryApplicant;
  contact: MandatoryContact;
  opportunity: MandatoryOpportunity;
  project: MandatoryProject;
  congressionalDistricts: MandatoryCongressionalDistricts;
  funding: MandatoryFunding;
  stateReview: MandatoryStateReview;
  debt: MandatoryDebt;
  certification: MandatoryCertification;
  authorizedRepresentative: MandatoryAuthorizedRepresentative;

  @doc("Attach supporting documents as specified in agency instructions.")
  @UI.label("Supporting Documents")
  @UI.widget(Rendering.Widget.AttachmentArray)
  @maxItems(100)
  attachments?: Questions.Types.Attachment[];
}

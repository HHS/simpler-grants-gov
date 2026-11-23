import "simpler-forms";
import "./form.tsp";
using SimplerForms;
namespace Forms.ApplicationAttachments;

@UI.layout(ApplicationAttachments)
model ApplicationAttachmentsLayout {
  @doc("Instructions:  On this form, you will attach the various files that make up your grant application. Please consult with the appropriate Agency Guidelines for more information about each needed file. Please remember that any files you attach must be in the document format and named as specified in the Guidelines.\n\nImportant:  Please attach your files in the proper sequence. See the appropriate Agency Guidelines for details.")
  @UI.label("Application files")
  section1: {
    att1: ApplicationAttachments.att1;
    att2: ApplicationAttachments.att2;
    att3: ApplicationAttachments.att3;
    att4: ApplicationAttachments.att4;
    att5: ApplicationAttachments.att5;
    att6: ApplicationAttachments.att6;
    att7: ApplicationAttachments.att7;
    att8: ApplicationAttachments.att8;
    att9: ApplicationAttachments.att9;
    att10: ApplicationAttachments.att10;
    att11: ApplicationAttachments.att11;
    att12: ApplicationAttachments.att12;
    att13: ApplicationAttachments.att13;
    att14: ApplicationAttachments.att14;
    att15: ApplicationAttachments.att15;
  };
}

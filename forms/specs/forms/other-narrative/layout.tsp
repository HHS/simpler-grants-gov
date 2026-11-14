import "simpler-forms";
import "./form.tsp";
using SimplerForms;
namespace Forms.OtherNarrative;
@UI.layout(OtherNarrative)
model OtherNarrativeLayout {
  @UI.label("1. Other Narrative File(s)")
  files: {
    attachments: OtherNarrative.attachments;
  };
}

import "form-library-xml";
import "simpler-forms";
import "simpler-forms-sgg";
import "#forms/index.tsp";
import "./fragments.tsp";
import "./examples.tsp";
using SimplerForms;
namespace Forms.RRPersonalData;

/** Voluntary demographic information for the project director and up to four co-directors. */
@Sgg.sync(#{ xml: "mapping" })
@Meta.form(#{
  id: "research-related-personal-data",
  formName: "Research & Related Personal Data",
})
@GrantsGov.form(#{
  legacyFormId: 357,
  shortFormName: "RR_PersonalData_1_2",
  formVersion: "1.2",
  agencyCode: "SGG",
  ombNumber: "4040-0001",
  expirationDate: "2029-01-31",
})
@example(Examples.threeDirectors)
model PersonalData {
  /** Providing demographic information is voluntary and is not a condition of award. You may choose “Do Not Wish to Provide” for any question. */
  @UI.label("Project Director/Principal Investigator")
  projectDirector: Director;

  @UI.label("Co-Project Directors/Co-Principal Investigators")
  @UI.widget(Rendering.Widget.FieldList)
  @maxItems(4)
  coProjectDirector?: Director[];
}
